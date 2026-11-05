/**
 * Marcador de imagem: identifica fotos repetidas. O MESMO arquivo existe em POC_OP/src/lib e POC_Mobile/src/utils.
 *  - sha: o MESMO arquivo, byte a byte (vale para foto original, antes do carimbo).
 *  - dhash: a MESMA imagem visualmente (recomprimida, reduzida, reenviada, ou já carimbada pelo POC).
 *
 * O dhash é calculado só na região central da foto: o POC desenha um carimbo no rodapé (hora, observador, equipe) e,
 * em fotos fora do horário, uma faixa de aviso no topo. Ignorar essas faixas faz a foto original e a carimbada
 * darem o mesmo dhash, e faz duas fotos carimbadas da mesma imagem-base (com carimbos diferentes) também casarem.
 */
export type Marcador = {
  /** Código curto exibido ao usuário (6 primeiros caracteres do SHA, maiúsculos). */
  c: string;
  /** SHA-256 (32 primeiros hex). */
  s: string;
  /** dHash 64 bits (16 hex). null se o navegador não decodifica a imagem. */
  d: string | null;
};

export type TipoRepeticao = "identica" | "parecida";

/** Distância máxima (de 64 bits) para considerar duas imagens "a mesma foto". Medido em ~9 mil fotos reais: não há pares a distância 2 entre fotos diferentes; 3 e 4 já são ruído. */
export const LIMITE_PARECIDA = 2;

/** Faixa vertical analisada: sem o topo (faixa de aviso) e sem o rodapé (carimbo). */
const CORTE_TOPO = 0.15;
const CORTE_BASE = 0.78;

const POPCOUNT = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

export function distanciaHash(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    dist += POPCOUNT[(parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16)) & 0xf]!;
  }
  return dist;
}

/** Hash quase todo 0 ou todo 1 (imagem lisa/escura) casa com qualquer outro: só vale o SHA. */
export function dhashInformativo(d: string): boolean {
  let ones = 0;
  for (const ch of d) ones += POPCOUNT[parseInt(ch, 16) & 0xf]!;
  return ones >= 12 && ones <= 52;
}

export function compararMarcadores(
  a: Pick<Marcador, "s" | "d">,
  b: Pick<Marcador, "s" | "d">,
): TipoRepeticao | null {
  if (a.s && a.s === b.s) return "identica";
  if (a.d && b.d && dhashInformativo(a.d) && dhashInformativo(b.d) && distanciaHash(a.d, b.d) <= LIMITE_PARECIDA) {
    return "parecida";
  }
  return null;
}

// ── Cálculo (navegador) ─────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

/** cyrb53: só quando `crypto.subtle` não existe (HTTP fora de localhost). */
function cyrb53(bytes: Uint8Array, seed: number): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes[i]!;
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

export async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle) return toHex(new Uint8Array(await subtle.digest("SHA-256", buf)));
  const bytes = new Uint8Array(buf);
  return `${cyrb53(bytes, 1)}${cyrb53(bytes, 2)}${cyrb53(bytes, 3)}`;
}

const GRADE_W = 72;
const GRADE_H = 64;

/** dHash: reduz a região central para 9×8 tons de cinza e compara pixels vizinhos (64 bits). */
async function dhashDoBlob(blob: Blob): Promise<string | null> {
  if (typeof createImageBitmap !== "function") return null;
  if (!blob.type.startsWith("image/")) return null;

  let bmp: ImageBitmap;
  try {
    // "from-image" aplica a rotação gravada pela câmera: a mesma foto sempre tem a mesma orientação
    bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  try {
    return dhashDeFonte(bmp, bmp.width, bmp.height);
  } finally {
    bmp.close?.();
  }
}

/** dHash de um canvas já desenhado (a foto reduzida, ANTES do carimbo): evita decodificar a foto de novo. */
export function dhashDoCanvas(canvas: HTMLCanvasElement): string | null {
  return dhashDeFonte(canvas, canvas.width, canvas.height);
}

function dhashDeFonte(fonte: CanvasImageSource, largura: number, altura: number): string | null {
  {
    const canvas = document.createElement("canvas");
    canvas.width = GRADE_W;
    canvas.height = GRADE_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const sy = altura * CORTE_TOPO;
    const sh = altura * (CORTE_BASE - CORTE_TOPO);
    ctx.drawImage(fonte, 0, sy, largura, sh, 0, 0, GRADE_W, GRADE_H);
    const { data } = ctx.getImageData(0, 0, GRADE_W, GRADE_H);

    // Média por bloco 8×8 → grade 9×8 em cinza.
    const gray: number[][] = [];
    for (let by = 0; by < 8; by++) {
      const row: number[] = [];
      for (let bx = 0; bx < 9; bx++) {
        let soma = 0;
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const p = ((by * 8 + y) * GRADE_W + (bx * 8 + x)) * 4;
            soma += 0.299 * data[p]! + 0.587 * data[p + 1]! + 0.114 * data[p + 2]!;
          }
        }
        row.push(soma / 64);
      }
      gray.push(row);
    }

    let hex = "";
    let nibble = 0;
    let bits = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        nibble = (nibble << 1) | (gray[y]![x]! > gray[y]![x + 1]! ? 1 : 0);
        if (++bits === 4) {
          hex += nibble.toString(16);
          nibble = 0;
          bits = 0;
        }
      }
    }
    return hex;
  }
}

/** Calcule SEMPRE no Blob original (antes de carimbar/comprimir) quando ele existir; nas fotos antigas, na foto carimbada. */
export async function calcularMarcador(blob: Blob): Promise<Marcador> {
  const buf = await blob.arrayBuffer();
  const s = (await sha256Hex(buf)).slice(0, 32);
  const d = await dhashDoBlob(blob);
  return { c: s.slice(0, 6).toUpperCase(), s, d };
}

/** Marcador da foto original (`blob`) usando o canvas já desenhado para o dHash. */
export async function calcularMarcadorComCanvas(blob: Blob, canvas: HTMLCanvasElement): Promise<Marcador> {
  const s = (await sha256Hex(await blob.arrayBuffer())).slice(0, 32);
  let d: string | null = null;
  try { d = dhashDoCanvas(canvas); } catch { d = null; }
  return { c: s.slice(0, 6).toUpperCase(), s, d };
}

// ── Marcador dentro do próprio JPEG (comentário COM) ─────────────────────────
// A foto carimbada carrega o marcador da foto ORIGINAL num segmento de comentário do JPEG. Assim ele viaja junto com a foto
// (rascunho, IndexedDB, envio) sem precisar de um campo extra em cada tela.

const ASSINATURA = "POCM1:";

/** Grava o marcador num comentário JPEG logo depois do início do arquivo. Se não for JPEG, devolve o blob como veio. */
export async function embutirMarcador(blob: Blob, m: Marcador): Promise<Blob> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return blob;
  const texto = new TextEncoder().encode(`${ASSINATURA}${JSON.stringify({ s: m.s, d: m.d })}`);
  const tam = texto.length + 2;
  if (tam > 0xffff) return blob;
  const seg = new Uint8Array(4 + texto.length);
  seg[0] = 0xff; seg[1] = 0xfe; seg[2] = (tam >> 8) & 0xff; seg[3] = tam & 0xff;
  seg.set(texto, 4);
  const out = new Uint8Array(buf.length + seg.length);
  out.set(buf.subarray(0, 2), 0);
  out.set(seg, 2);
  out.set(buf.subarray(2), 2 + seg.length);
  return new Blob([out], { type: blob.type || "image/jpeg" });
}

/** Procura o comentário com o marcador no início de um JPEG (só olha os primeiros segmentos). */
export function lerMarcadorDeBytes(buf: Uint8Array): Pick<Marcador, "s" | "d"> | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 < buf.length && i < 4096) {
    if (buf[i] !== 0xff) return null;
    const marcador = buf[i + 1]!;
    if (marcador === 0xda || marcador === 0xd9) return null; // começou a imagem: não há mais metadados
    const len = (buf[i + 2]! << 8) | buf[i + 3]!;
    if (marcador === 0xfe) {
      const texto = new TextDecoder().decode(buf.subarray(i + 4, i + 2 + len));
      if (texto.startsWith(ASSINATURA)) {
        try {
          const j = JSON.parse(texto.slice(ASSINATURA.length)) as { s?: unknown; d?: unknown };
          if (typeof j.s === "string" && j.s) return { s: j.s, d: typeof j.d === "string" ? j.d : null };
        } catch { /* comentário de outro programa */ }
      }
    }
    i += 2 + len;
  }
  return null;
}

/** Marcador embutido numa foto em data URL (como o app guarda as fotos até o envio). */
export function lerMarcadorDeDataUrl(dataUrl: string): Pick<Marcador, "s" | "d"> | null {
  const virgula = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || virgula < 0) return null;
  try {
    // os primeiros ~5 KB bastam (4/3 de base64): evita decodificar a foto inteira
    const trecho = dataUrl.slice(virgula + 1, virgula + 1 + 7000);
    const bin = atob(trecho.slice(0, trecho.length - (trecho.length % 4)));
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return lerMarcadorDeBytes(bytes);
  } catch {
    return null;
  }
}

/** Marcador embutido num Blob JPEG. */
export async function lerMarcadorDeBlob(blob: Blob): Promise<Pick<Marcador, "s" | "d"> | null> {
  return lerMarcadorDeBytes(new Uint8Array(await blob.slice(0, 5000).arrayBuffer()));
}
