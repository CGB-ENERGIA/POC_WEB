export interface PosRotulos {
  /** Quanto o número da barra sobe (px) acima da posição normal. */
  barUp: number;
  /** Número da meta acima ou abaixo do traço. */
  metaPos: "top" | "bottom";
  /** Distância (px) do número da meta ao traço. */
  metaDist: number;
}

const ALT = 13; // altura do texto (fonte 11px em negrito)
const FOLGA = 3; // respiro mínimo entre os dois números
const MEIO_TRACO = 2.5; // metade da altura do traço da meta (símbolo de 5px)
const DIST_BARRA = 2; // distância normal do número da barra ao topo
const SUBIDA_BARRA = 13;

type Faixa = [number, number];
const sobrepoe = (a: Faixa, b: Faixa) => a[0] < b[1] + FOLGA && b[0] < a[1] + FOLGA;

/**
 * Decide onde ficam o número da barra (realizado) e o da meta para que um não cubra o outro.
 * Trabalha em px acima do eixo: testa as combinações da mais natural para a menos e fica com a primeira
 * que não sobrepõe (e que não invade o eixo, no caso do número abaixo do traço).
 */
export function posicionarRotulos(realizado: number, meta: number, pxPorUnidade: number): PosRotulos {
  const yBarra = realizado * pxPorUnidade;
  const yMeta = meta * pxPorUnidade;

  const faixaBarra = (up: number): Faixa => [yBarra + DIST_BARRA + up, yBarra + DIST_BARRA + up + ALT];
  const faixaMetaTopo = (d: number): Faixa => [yMeta + MEIO_TRACO + d, yMeta + MEIO_TRACO + d + ALT];
  const faixaMetaBaixo: Faixa = [yMeta - MEIO_TRACO - 8 - ALT, yMeta - MEIO_TRACO - 8];
  const cabeAbaixo = faixaMetaBaixo[0] >= 2;

  const candidatas: (PosRotulos & { ok: boolean })[] = [
    { barUp: 0, metaPos: "top", metaDist: 8, ok: true },
    { barUp: 0, metaPos: "bottom", metaDist: 8, ok: cabeAbaixo },
    { barUp: SUBIDA_BARRA, metaPos: "top", metaDist: 8, ok: true },
    { barUp: SUBIDA_BARRA, metaPos: "bottom", metaDist: 8, ok: cabeAbaixo },
    { barUp: 0, metaPos: "top", metaDist: 22, ok: true },
    { barUp: SUBIDA_BARRA, metaPos: "top", metaDist: 22, ok: true },
    { barUp: 0, metaPos: "top", metaDist: 36, ok: true },
    { barUp: SUBIDA_BARRA, metaPos: "top", metaDist: 36, ok: true },
  ];

  for (const c of candidatas) {
    if (!c.ok) continue;
    const meta = c.metaPos === "top" ? faixaMetaTopo(c.metaDist) : faixaMetaBaixo;
    if (!sobrepoe(faixaBarra(c.barUp), meta)) {
      return { barUp: c.barUp, metaPos: c.metaPos, metaDist: c.metaDist };
    }
  }
  return { barUp: SUBIDA_BARRA, metaPos: "top", metaDist: 36 };
}
