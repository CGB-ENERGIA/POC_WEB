/**
 * Uma foto não pode ser mais nova que o próprio envio. Se a data gravada no celular é
 * posterior à data em que a nuvem recebeu o arquivo (celular com relógio adiantado),
 * devolve a data da nuvem; caso contrário devolve null (nada a corrigir).
 *
 * Só corrige no sentido "futuro": foto tirada offline e enviada depois tem data local
 * anterior ao envio, o que é normal e deve ser mantido.
 */
const TOLERANCIA_MS = 10 * 60 * 1000;

export function dataCorrigidaPelaNuvem(localISO: string, nuvemISO: string): string | null {
  const local = Date.parse(localISO);
  const nuvem = Date.parse(nuvemISO);
  if (Number.isNaN(local) || Number.isNaN(nuvem)) return null;
  return local > nuvem + TOLERANCIA_MS ? nuvemISO : null;
}
