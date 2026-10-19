/**
 * Foto da galeria interna usada num checklist.
 *
 * A foto já saiu da câmera do app com o carimbo da hora em que foi tirada. Antes ela era
 * carimbada DE NOVO com a hora da importação, o que fazia uma foto antiga parecer atual
 * (ex.: foto das 11:17 virava "20:12"). Agora o carimbo original é preservado e a imagem
 * não recebe nenhuma marca extra, mesmo quando é mais velha que o limite.
 */
import { getTrustedTime } from "@/utils/server-time";

/**
 * false: aceita a foto antiga, sem marcar a imagem.
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
    // Auditoria sem marca na imagem: a foto entra como veio, com o carimbo original da câmera.
  }

  return lerComoBase64(blob);
}
