/**
 * Foto da galeria interna usada num checklist.
 *
 * A foto já saiu da câmera do app com o carimbo da hora em que foi tirada. Antes ela era
 * carimbada DE NOVO com a hora da importação, o que fazia uma foto antiga parecer atual
 * (ex.: foto das 11:17 virava "20:12"). Agora o carimbo original é preservado e, se a foto
 * for mais velha que o limite, recebe uma faixa vermelha no topo com a hora real.
 */
import { getTrustedTime } from "@/utils/server-time";

/**
 * false (auditoria): aceita a foto antiga, mas com a faixa vermelha.
 * true  (bloqueio):  recusa foto da galeria mais velha que o limite.
 */
export const BLOQUEAR_GALERIA_ANTIGA = false;
/** Idade máxima de uma foto da galeria para entrar no checklist sem aviso. */
export const IDADE_MAX_GALERIA_MS = 30 * 60 * 1000;

export class FotoGaleriaAntigaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FotoGaleriaAntigaError";
  }
}

function lerComoBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function descreverIdade(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} dias`;
}

function quando(d: Date): string {
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function comFaixa(blob: Blob, linhas: string[]): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

  const fs = Math.max(16, Math.round(canvas.width * 0.034));
  const pad = Math.round(fs * 0.6);
  const lh = Math.round(fs * 1.35);
  ctx.fillStyle = "rgba(185, 28, 28, 0.92)";
  ctx.fillRect(0, 0, canvas.width, pad * 2 + linhas.length * lh);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  linhas.forEach((t, i) => {
    ctx.font = `${i === 0 ? "bold " : ""}${fs}px sans-serif`;
    ctx.fillText(t, pad, pad + i * lh, canvas.width - pad * 2);
  });
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Devolve a foto da galeria pronta para o checklist (data URL), sem recarimbar.
 * `dataHoraOriginal`: quando a foto foi tirada (ISO), vinda da galeria.
 */
export async function prepararFotoDaGaleria(
  blob: Blob,
  dataHoraOriginal?: string,
  opcoes: { bloquear?: boolean } = {},
): Promise<string> {
  const bloquear = opcoes.bloquear ?? BLOQUEAR_GALERIA_ANTIGA;

  let idadeMs: number | null = null;
  const tirada = dataHoraOriginal ? new Date(dataHoraOriginal) : null;
  if (tirada && !Number.isNaN(tirada.getTime())) {
    try {
      idadeMs = (await getTrustedTime()).date.getTime() - tirada.getTime();
    } catch {
      idadeMs = null; // sem horário confiável: segue sem a conferência (a foto mantém o carimbo original)
    }
  }

  if (idadeMs !== null && tirada && idadeMs > IDADE_MAX_GALERIA_MS) {
    if (bloquear) {
      throw new FotoGaleriaAntigaError(
        `Esta foto foi tirada em ${quando(tirada)} (há ${descreverIdade(idadeMs)}). ` +
          "Tire uma foto nova agora, direto pela câmera.",
      );
    }
    return comFaixa(blob, [
      "ATENÇÃO: FOTO DA GALERIA (NÃO É DE AGORA)",
      `Tirada em ${quando(tirada)} (há ${descreverIdade(idadeMs)})`,
    ]);
  }

  return lerComoBase64(blob);
}
