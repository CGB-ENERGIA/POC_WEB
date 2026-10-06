/**
 * Câmera nativa do celular via <input type="file" capture>.
 *
 * O app do próprio aparelho cuida de zoom, foco, flash, troca de câmera, rotação e
 * selfie — funciona igual em qualquer Android/iPhone. Aqui lemos o arquivo,
 * aplicamos a orientação gravada pelo aparelho (EXIF), reduzimos o tamanho e
 * conferimos se a foto é recente (anti-fraude).
 */
import { getTrustedTime } from "@/utils/server-time";

const MAX_LADO = 1600;
const QUALIDADE = 0.8;

/**
 * Anti-fraude por "frescor": a foto precisa ter sido criada há poucos minutos, segundo o
 * horário do servidor.
 *  - false (auditoria): a foto é aceita, mas sai com uma faixa vermelha no topo.
 *  - true  (bloqueio):  a foto é recusada e o usuário precisa tirar outra.
 */
export const BLOQUEAR_FOTO_ANTIGA = false;
const IDADE_MAX_MS = 3 * 60 * 1000;
const FUTURO_MAX_MS = 2 * 60 * 1000;
/** Diferença máxima aceita entre o relógio do celular e o do servidor (celular com hora automática fica em segundos). */
const RELOGIO_MAX_MS = 3 * 60 * 1000;

export class FotoAntigaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FotoAntigaError";
  }
}

export interface Frescor {
  ok: boolean;
  motivo?: "antiga" | "futura" | "relogio";
  /** Quando a foto foi criada, convertido para o horário do servidor. */
  capturadaEm: Date;
  idadeMs: number;
  fonte: "exif" | "arquivo";
  /** Servidor menos relógio do celular (positivo = celular atrasado). */
  desvioRelogioMs: number;
}

/** Cria (uma vez por chamada) um input de câmera e o abre. Precisa vir de um toque do usuário. */
export function abrirCameraNativa(
  input: HTMLInputElement | null | undefined,
): void {
  if (!input) return;
  input.value = ""; // permite escolher/tirar de novo
  input.click();
}

// ─── EXIF: data em que a câmera gravou a foto ────────────────────────────────

/** Lê DateTimeOriginal (ou a data equivalente) do EXIF de um JPEG. Devolve ms em horário local do aparelho. */
export function lerDataExif(buf: ArrayBuffer): number | null {
  try {
    const v = new DataView(buf);
    if (v.byteLength < 12 || v.getUint16(0) !== 0xffd8) return null;

    let off = 2;
    while (off + 4 < v.byteLength) {
      if (v.getUint8(off) !== 0xff) return null;
      const marker = v.getUint8(off + 1);
      const len = v.getUint16(off + 2);

      if (marker === 0xe1 && v.getUint32(off + 4) === 0x45786966) {
        const tiff = off + 10;
        const little = v.getUint16(tiff) === 0x4949;
        const u16 = (o: number) => v.getUint16(o, little);
        const u32 = (o: number) => v.getUint32(o, little);
        if (u16(tiff + 2) !== 0x2a) return null;

        const achar = (ifd: number, tag: number): { tipo: number; n: number; val: number } | null => {
          const total = u16(ifd);
          for (let i = 0; i < total; i++) {
            const e = ifd + 2 + i * 12;
            if (u16(e) === tag) return { tipo: u16(e + 2), n: u32(e + 4), val: e + 8 };
          }
          return null;
        };
        const texto = (e: { n: number; val: number }) => {
          const ini = e.n > 4 ? tiff + u32(e.val) : e.val;
          let r = "";
          for (let i = 0; i < Math.min(e.n, 19); i++) r += String.fromCharCode(v.getUint8(ini + i));
          return r;
        };

        const ifd0 = tiff + u32(tiff + 4);
        const exifPtr = achar(ifd0, 0x8769);
        const candidatos: string[] = [];
        if (exifPtr) {
          const exifIfd = tiff + u32(exifPtr.val);
          for (const tag of [0x9003, 0x9004]) {
            const e = achar(exifIfd, tag);
            if (e && e.tipo === 2) candidatos.push(texto(e));
          }
        }
        const d0 = achar(ifd0, 0x0132);
        if (d0 && d0.tipo === 2) candidatos.push(texto(d0));

        for (const t of candidatos) {
          const m = t.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
          if (!m) continue;
          const ano = Number(m[1]);
          if (ano < 2000) continue;
          return new Date(ano, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])).getTime();
        }
        return null;
      }
      off += 2 + len;
    }
  } catch {
    /* EXIF ilegível: segue só com a data do arquivo */
  }
  return null;
}

// ─── Frescor ─────────────────────────────────────────────────────────────────

/**
 * Compara a data de criação da foto (a mais antiga entre a data do arquivo e a do EXIF)
 * com o horário do servidor. Se o relógio do celular divergir do servidor, a foto é
 * sinalizada: sem isso, bastaria voltar o relógio para o dia da foto antiga. Devolve null
 * se não houver como avaliar (sem horário do servidor ou sem nenhuma data na foto).
 */
export async function avaliarFrescor(file: File): Promise<Frescor | null> {
  let servidorAgora: number;
  try {
    servidorAgora = (await getTrustedTime()).date.getTime();
  } catch {
    return null; // quem processa a foto já trata a falta de horário confiável
  }
  const desvio = servidorAgora - Date.now();
  const relogioErrado = Math.abs(desvio) > RELOGIO_MAX_MS;

  const candidatos: { ms: number; fonte: "exif" | "arquivo" }[] = [];
  if (file.lastModified > 0) candidatos.push({ ms: file.lastModified + desvio, fonte: "arquivo" });
  try {
    const exif = lerDataExif(await file.slice(0, 131072).arrayBuffer());
    if (exif) candidatos.push({ ms: exif + desvio, fonte: "exif" });
  } catch {
    /* sem EXIF */
  }
  if (!candidatos.length) return null;

  const c = candidatos.reduce((a, b) => (a.ms <= b.ms ? a : b));
  const idadeMs = servidorAgora - c.ms;
  const base = { capturadaEm: new Date(c.ms), idadeMs, fonte: c.fonte, desvioRelogioMs: desvio };

  if (relogioErrado) return { ok: false, motivo: "relogio", ...base };
  if (idadeMs > IDADE_MAX_MS) return { ok: false, motivo: "antiga", ...base };
  if (idadeMs < -FUTURO_MAX_MS) return { ok: false, motivo: "futura", ...base };
  return { ok: true, ...base };
}

function descreverIdade(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} dias`;
}

function descreverQuando(f: Frescor): string {
  if (f.motivo === "relogio") {
    const lado = f.desvioRelogioMs > 0 ? "atrasado" : "adiantado";
    return `relógio do celular ${lado} ${descreverIdade(Math.abs(f.desvioRelogioMs))}`;
  }
  const dh = f.capturadaEm.toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return f.motivo === "futura"
    ? `horário da foto inconsistente (${dh})`
    : `tirada em ${dh} (há ${descreverIdade(f.idadeMs)})`;
}

// ─── Leitura da foto ─────────────────────────────────────────────────────────

async function carregar(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; fechar: () => void }> {
  // createImageBitmap com "from-image" aplica a rotação EXIF da câmera.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { src: bmp, w: bmp.width, h: bmp.height, fechar: () => bmp.close() };
    } catch {
      /* cai para <img> */
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  // Navegadores atuais aplicam o EXIF ao <img> (image-orientation: from-image).
  return { src: img, w: img.naturalWidth, h: img.naturalHeight, fechar: () => URL.revokeObjectURL(url) };
}

function desenharFaixa(ctx: CanvasRenderingContext2D, largura: number, linhas: string[]) {
  const fs = Math.max(16, Math.round(largura * 0.034));
  const pad = Math.round(fs * 0.6);
  const lh = Math.round(fs * 1.35);
  const altura = pad * 2 + linhas.length * lh;
  ctx.fillStyle = "rgba(185, 28, 28, 0.92)";
  ctx.fillRect(0, 0, largura, altura);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  linhas.forEach((t, i) => {
    ctx.font = `${i === 0 ? "bold " : ""}${fs}px sans-serif`;
    ctx.fillText(t, pad, pad + i * lh, largura - pad * 2);
  });
}

export interface OpcoesFotoNativa {
  /** Recusa foto antiga (padrão: BLOQUEAR_FOTO_ANTIGA). */
  bloquear?: boolean;
}

/**
 * Lê a foto da câmera nativa já em pé e reduzida, como data URL JPEG.
 * Foto antiga/inconsistente: no modo auditoria recebe uma faixa vermelha no topo;
 * no modo bloqueio lança FotoAntigaError.
 */
export async function fotoNativaParaBase64(file: File, opcoes: OpcoesFotoNativa = {}): Promise<string> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|heic|heif|webp)$/i.test(file.name)) {
    throw new Error("O arquivo não é uma imagem.");
  }
  const bloquear = opcoes.bloquear ?? BLOQUEAR_FOTO_ANTIGA;

  const frescor = await avaliarFrescor(file);
  if (frescor && !frescor.ok && bloquear) {
    throw new FotoAntigaError(
      frescor.motivo === "relogio"
        ? `O ${descreverQuando(frescor)} em relação à hora real. Ative "Data e hora automáticas" nas configurações do celular e tente de novo.`
        : `Esta foto foi ${frescor.motivo === "futura" ? "gravada com horário inconsistente" : descreverQuando(frescor)}. ` +
            "Tire uma nova foto agora, direto pela câmera.",
    );
  }

  const { src, w, h, fechar } = await carregar(file);
  try {
    const escala = Math.min(1, MAX_LADO / Math.max(w, h));
    const cw = Math.round(w * escala);
    const ch = Math.round(h * escala);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(src, 0, 0, cw, ch);
    if (frescor && !frescor.ok) {
      desenharFaixa(ctx, cw, ["ATENÇÃO: FOTO FORA DO HORÁRIO", descreverQuando(frescor)]);
    }
    return canvas.toDataURL("image/jpeg", QUALIDADE);
  } finally {
    fechar();
  }
}
