import { BRAND, LOGO_URL } from "@/constants/brand";

export interface LinhaRanking {
  nome: string;
  funcao: string;
  realizado: number;
  meta: number;
  coordenador?: string;
}

export interface OpcoesRanking {
  titulo: string;
  /** Ex.: "2ª semana · out/2026" */
  periodo: string;
  /** Chips de filtros ativos (gerência, base, processo…). */
  filtros: string[];
  ordem: "desc" | "asc" | "az";
  linhas: LinhaRanking[];
  /** Separa a lista em seções por coordenador (cada uma com seus totais). */
  agrupar?: boolean;
}

const W = 1080;
const PAD = 48;
const GAP = 24;
const ALTURA_LINHA = 62;
const ALTURA_SECAO = 64;
const LINHAS_POR_PAGINA = 56;
const LISTA_MAX = 1900;
const FONTE = "Roboto, 'Segoe UI', system-ui, sans-serif";
const SEM_COORDENADOR = "Sem coordenador";

const COR = {
  fundo: "#0b1020",
  fundo2: "#140a12",
  card: "#131a2e",
  cardAlt: "#101627",
  linha: "rgba(148,163,184,.14)",
  texto: "#f1f5f9",
  muted: "#94a3b8",
  ok: "#4ade80",
  okEscuro: "#16a34a",
  falta: "#fb7185",
  faltaEscuro: "#be123c",
  meta: "#fecdd3",
  vinho: "#5c0f1a",
  vinho2: "#8b1c2b",
};

const ORDEM_TXT = { desc: "Maior → menor", asc: "Menor → maior", az: "Ordem alfabética" } as const;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function cortar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number) {
  if (ctx.measureText(texto).width <= larguraMax) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > larguraMax) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** "Antonio Wilke Vieira dos Reis" -> "Antonio Reis" */
function nomeCurto(nome: string) {
  const p = nome.trim().split(/\s+/).filter((x) => !/^(d[aeo]s?|e)$/i.test(x));
  if (p.length <= 2) return p.join(" ");
  return `${p[0]} ${p[p.length - 1]}`;
}

function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function ordenar(linhas: LinhaRanking[], ordem: OpcoesRanking["ordem"]) {
  const l = [...linhas];
  const porNome = (a: LinhaRanking, b: LinhaRanking) => a.nome.localeCompare(b.nome, "pt-BR");
  if (ordem === "desc") return l.sort((a, b) => b.realizado - a.realizado || porNome(a, b));
  if (ordem === "asc") return l.sort((a, b) => a.realizado - b.realizado || porNome(a, b));
  return l.sort(porNome);
}

function resumir(linhas: LinhaRanking[]) {
  const obs = linhas.reduce((s, l) => s + l.realizado, 0);
  const meta = linhas.reduce((s, l) => s + l.meta, 0);
  const naMeta = linhas.filter((l) => l.realizado >= l.meta).length;
  const pct = linhas.length ? Math.round((naMeta / linhas.length) * 100) : 0;
  return { obs, meta, naMeta, pct, n: linhas.length };
}

/** Quebra os chips em linhas que caibam na largura. */
function quebrarChips(ctx: CanvasRenderingContext2D, chips: string[], largura: number) {
  const linhas: string[][] = [[]];
  let usado = 0;
  for (const c of chips) {
    const w = ctx.measureText(c).width + 36;
    if (usado + w > largura && linhas[linhas.length - 1]!.length) {
      linhas.push([]);
      usado = 0;
    }
    linhas[linhas.length - 1]!.push(c);
    usado += w + 10;
  }
  return linhas;
}

// ─── Paginação em blocos ─────────────────────────────────────────────────────

interface Bloco {
  /** Cabeçalho de seção (coordenador). Sem título = lista corrida. */
  titulo?: string;
  resumo?: ReturnType<typeof resumir>;
  linhas: LinhaRanking[];
  /** Posição do 1º item no ranking (a numeração segue a ordem escolhida). */
  numInicio: number;
}
interface Pagina {
  blocos: Bloco[];
}

function alturaBloco(b: Bloco, colunas: number) {
  return (b.titulo ? ALTURA_SECAO + 8 : 0) + Math.ceil(b.linhas.length / colunas) * ALTURA_LINHA;
}

function paginarCorrido(todas: LinhaRanking[]): Pagina[] {
  const paginas: Pagina[] = [];
  for (let i = 0; i < todas.length; i += LINHAS_POR_PAGINA) {
    paginas.push({ blocos: [{ linhas: todas.slice(i, i + LINHAS_POR_PAGINA), numInicio: i }] });
  }
  return paginas.length ? paginas : [{ blocos: [{ linhas: [], numInicio: 0 }] }];
}

function paginarPorCoordenador(todas: LinhaRanking[], ordem: OpcoesRanking["ordem"], colunas: number): Pagina[] {
  const grupos = new Map<string, LinhaRanking[]>();
  for (const l of todas) {
    const c = l.coordenador?.trim() || SEM_COORDENADOR;
    if (!grupos.has(c)) grupos.set(c, []);
    grupos.get(c)!.push(l);
  }
  const nomes = [...grupos.keys()].sort((a, b) => {
    if (a === SEM_COORDENADOR) return 1;
    if (b === SEM_COORDENADOR) return -1;
    return a.localeCompare(b, "pt-BR");
  });

  const maxLinhasBloco = Math.max(colunas, Math.floor((LISTA_MAX - ALTURA_SECAO - 8) / ALTURA_LINHA) * colunas);
  const paginas: Pagina[] = [{ blocos: [] }];
  let usado = 0;

  for (const nome of nomes) {
    const linhasGrupo = ordenar(grupos.get(nome)!, ordem);
    const resumo = resumir(linhasGrupo);
    for (let ini = 0; ini < linhasGrupo.length; ini += maxLinhasBloco) {
      const parte = linhasGrupo.slice(ini, ini + maxLinhasBloco);
      const bloco: Bloco = {
        titulo: ini === 0 ? nome : `${nome} (continuação)`,
        resumo,
        linhas: parte,
        numInicio: ini,
      };
      const h = alturaBloco(bloco, colunas) + 14;
      const atual = paginas[paginas.length - 1]!;
      if (usado + h > LISTA_MAX && atual.blocos.length) {
        paginas.push({ blocos: [bloco] });
        usado = h;
      } else {
        atual.blocos.push(bloco);
        usado += h;
      }
    }
  }
  return paginas;
}

// ─── Desenho ─────────────────────────────────────────────────────────────────

function desenharLinha(
  ctx: CanvasRenderingContext2D,
  l: LinhaRanking,
  pos: number,
  x: number,
  y: number,
  colW: number,
  duasColunas: boolean,
  zebra: boolean,
  escalaMax: number,
) {
  const ok = l.realizado >= l.meta;

  ctx.fillStyle = zebra ? COR.card : COR.cardAlt;
  rr(ctx, x, y + 4, colW, ALTURA_LINHA - 8, 12);
  ctx.fill();

  // posição
  const rx = x + 14;
  ctx.fillStyle = ok ? "rgba(74,222,128,.16)" : "rgba(251,113,133,.16)";
  rr(ctx, rx, y + 15, 38, 32, 10);
  ctx.fill();
  ctx.fillStyle = ok ? COR.ok : COR.falta;
  ctx.font = `800 17px ${FONTE}`;
  ctx.textAlign = "center";
  ctx.fillText(String(pos), rx + 19, y + 37);
  ctx.textAlign = "left";

  // nome + função
  const nomeW = Math.round(colW * (duasColunas ? 0.36 : 0.34));
  const nx = rx + 38 + 14;
  ctx.fillStyle = COR.texto;
  ctx.font = `700 21px ${FONTE}`;
  ctx.fillText(cortar(ctx, nomeCurto(l.nome), nomeW), nx, y + 31);
  ctx.fillStyle = COR.muted;
  ctx.font = `500 14px ${FONTE}`;
  ctx.fillText(cortar(ctx, l.funcao, nomeW), nx, y + 50);

  // valor
  const valW = 86;
  const vx = x + colW - 14 - valW;
  ctx.textAlign = "right";
  const metaTxt = `/${l.meta}`;
  ctx.font = `600 17px ${FONTE}`;
  const wMeta = ctx.measureText(metaTxt).width;
  ctx.fillStyle = COR.muted;
  ctx.fillText(metaTxt, vx + valW, y + 40);
  ctx.fillStyle = ok ? COR.ok : COR.falta;
  ctx.font = `800 26px ${FONTE}`;
  ctx.fillText(String(l.realizado), vx + valW - wMeta - 2, y + 40);
  ctx.textAlign = "left";

  // barra
  const bx = nx + nomeW + 14;
  const bw = vx - 12 - bx;
  const by = y + 24;
  const bh = 14;
  ctx.fillStyle = "rgba(148,163,184,.16)";
  rr(ctx, bx, by, bw, bh, 7);
  ctx.fill();
  const fw = Math.max(l.realizado > 0 ? 8 : 0, (l.realizado / escalaMax) * bw);
  if (fw > 0) {
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, ok ? COR.okEscuro : COR.faltaEscuro);
    g.addColorStop(1, ok ? COR.ok : COR.falta);
    ctx.fillStyle = g;
    rr(ctx, bx, by, Math.min(fw, bw), bh, 7);
    ctx.fill();
  }
  if (l.meta > 0) {
    const mx = bx + Math.min(1, l.meta / escalaMax) * bw;
    ctx.fillStyle = COR.meta;
    rr(ctx, mx - 2, by - 5, 4, bh + 10, 2);
    ctx.fill();
  }
}

function desenharSecao(ctx: CanvasRenderingContext2D, b: Bloco, y: number) {
  const x = PAD;
  const w = W - PAD * 2;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "rgba(139,28,43,.55)");
  g.addColorStop(1, "rgba(139,28,43,.10)");
  ctx.fillStyle = g;
  rr(ctx, x, y, w, ALTURA_SECAO - 8, 14);
  ctx.fill();
  ctx.fillStyle = COR.vinho2;
  rr(ctx, x, y, 8, ALTURA_SECAO - 8, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = `700 13px ${FONTE}`;
  ctx.letterSpacing = "2px";
  ctx.fillText("COORDENADOR", x + 26, y + 20);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#fff";
  ctx.font = `800 26px ${FONTE}`;
  ctx.fillText(cortar(ctx, b.titulo ?? "", w * 0.5), x + 26, y + 46);

  if (b.resumo) {
    const r = b.resumo;
    const cor = r.pct >= 100 ? COR.ok : r.pct >= 60 ? COR.meta : COR.falta;
    ctx.textAlign = "right";
    ctx.fillStyle = cor;
    ctx.font = `800 28px ${FONTE}`;
    ctx.fillText(`${r.pct}%`, x + w - 20, y + 30);
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = `500 15px ${FONTE}`;
    ctx.fillText(`${r.n} observadores · ${r.obs} obs · ${r.naMeta} na meta`, x + w - 20, y + 48);
    ctx.textAlign = "left";
  }
}

function desenharPagina(
  logo: HTMLImageElement | null,
  op: OpcoesRanking,
  todas: LinhaRanking[],
  pagina: Pagina,
  idx: number,
  total: number,
  escalaMax: number,
  colunas: number,
): Promise<Blob> {
  const medidor = document.createElement("canvas").getContext("2d")!;
  medidor.font = `600 22px ${FONTE}`;
  const chipsLinhas = quebrarChips(medidor, op.filtros, W - PAD * 2);

  const alturaCab = op.filtros.length ? 164 + chipsLinhas.length * 46 + 8 : 176;
  const alturaResumo = 132;
  const alturaSecaoTitulo = 64;
  const alturaLista = pagina.blocos.reduce((s, b) => s + alturaBloco(b, colunas) + (b.titulo ? 14 : 0), 0) + 24;
  const alturaRodape = 96;
  const H = alturaCab + alturaResumo + alturaSecaoTitulo + alturaLista + alturaRodape;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // fundo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, COR.fundo);
  bg.addColorStop(1, COR.fundo2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // cabeçalho
  const cab = ctx.createLinearGradient(0, 0, W, alturaCab);
  cab.addColorStop(0, COR.vinho);
  cab.addColorStop(1, COR.vinho2);
  ctx.fillStyle = cab;
  ctx.fillRect(0, 0, W, alturaCab);
  ctx.fillStyle = "rgba(255,255,255,.07)";
  ctx.beginPath();
  ctx.arc(W - 40, -30, 210, 0, Math.PI * 2);
  ctx.fill();

  let xTexto = PAD;
  if (logo) {
    const lh = 78;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, PAD, 36, lw, lh);
    xTexto = PAD + lw + 22;
  }
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = `700 20px ${FONTE}`;
  ctx.letterSpacing = "3px";
  ctx.fillText(BRAND.name.toUpperCase(), xTexto, 62);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#fff";
  ctx.font = `800 46px ${FONTE}`;
  ctx.fillText(cortar(ctx, op.titulo, W - xTexto - PAD), xTexto, 112);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = `500 25px ${FONTE}`;
  ctx.fillText(op.periodo, xTexto, 146);

  if (op.filtros.length) {
    ctx.font = `600 22px ${FONTE}`;
    chipsLinhas.forEach((linha, li) => {
      let x = PAD;
      const y = 166 + li * 46;
      for (const c of linha) {
        const w = ctx.measureText(c).width + 36;
        ctx.fillStyle = "rgba(255,255,255,.16)";
        rr(ctx, x, y, w, 38, 19);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(c, x + 18, y + 26);
        x += w + 10;
      }
    });
  }

  // resumo geral
  const geral = resumir(todas);
  const tiles = [
    { label: "OBSERVAÇÕES", valor: String(geral.obs), cor: COR.texto },
    { label: "META DA SEMANA", valor: String(geral.meta), cor: COR.meta },
    { label: "ATINGIMENTO", valor: `${geral.pct}%`, sub: `${geral.naMeta} de ${geral.n} na meta`, cor: geral.pct >= 100 ? COR.ok : COR.falta },
  ];
  const tw = (W - PAD * 2 - GAP * 2) / 3;
  tiles.forEach((t, i) => {
    const x = PAD + i * (tw + GAP);
    const y = alturaCab + 24;
    ctx.fillStyle = COR.card;
    rr(ctx, x, y, tw, 96, 16);
    ctx.fill();
    ctx.strokeStyle = COR.linha;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = COR.muted;
    ctx.font = `700 15px ${FONTE}`;
    ctx.letterSpacing = "1.5px";
    ctx.fillText(t.label, x + 20, y + 30);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = t.cor;
    ctx.font = `800 40px ${FONTE}`;
    ctx.fillText(t.valor, x + 20, y + 74);
    if (t.sub) {
      const vw = ctx.measureText(t.valor).width;
      ctx.fillStyle = COR.muted;
      ctx.font = `500 15px ${FONTE}`;
      ctx.fillText(t.sub, x + 20 + vw + 12, y + 72);
    }
  });

  // título da seção
  const ySecao = alturaCab + alturaResumo + 8;
  ctx.fillStyle = COR.texto;
  ctx.font = `800 26px ${FONTE}`;
  ctx.fillText("Observações por observador", PAD, ySecao + 30);
  ctx.fillStyle = COR.muted;
  ctx.font = `500 19px ${FONTE}`;
  const parte = total > 1 ? ` · Parte ${idx + 1}/${total}` : "";
  const agrup = op.agrupar ? "Por coordenador · " : "";
  ctx.textAlign = "right";
  ctx.fillText(`${agrup}${ORDEM_TXT[op.ordem]} · ${todas.length} observadores${parte}`, W - PAD, ySecao + 30);
  ctx.textAlign = "left";

  // blocos
  const duasColunas = colunas === 2;
  const colW = (W - PAD * 2 - GAP * (colunas - 1)) / colunas;
  let y = ySecao + 52;
  for (const b of pagina.blocos) {
    if (b.titulo) {
      desenharSecao(ctx, b, y);
      y += ALTURA_SECAO + 8;
    }
    const porColuna = Math.ceil(b.linhas.length / colunas);
    b.linhas.forEach((l, i) => {
      const col = duasColunas ? Math.floor(i / porColuna) : 0;
      const linhaNaCol = duasColunas ? i % porColuna : i;
      desenharLinha(
        ctx, l, b.numInicio + i + 1,
        PAD + col * (colW + GAP), y + linhaNaCol * ALTURA_LINHA,
        colW, duasColunas, linhaNaCol % 2 === 0, escalaMax,
      );
    });
    y += porColuna * ALTURA_LINHA + (b.titulo ? 14 : 0);
  }

  // rodapé
  const yRod = H - alturaRodape + 18;
  ctx.fillStyle = COR.linha;
  ctx.fillRect(PAD, yRod, W - PAD * 2, 1.5);
  ctx.fillStyle = COR.ok;
  rr(ctx, PAD, yRod + 24, 22, 10, 5);
  ctx.fill();
  ctx.fillStyle = COR.muted;
  ctx.font = `500 17px ${FONTE}`;
  ctx.fillText("Meta atingida", PAD + 32, yRod + 34);
  ctx.fillStyle = COR.falta;
  rr(ctx, PAD + 170, yRod + 24, 22, 10, 5);
  ctx.fill();
  ctx.fillStyle = COR.muted;
  ctx.fillText("Abaixo da meta", PAD + 202, yRod + 34);
  ctx.fillStyle = COR.meta;
  rr(ctx, PAD + 370, yRod + 19, 4, 20, 2);
  ctx.fill();
  ctx.fillStyle = COR.muted;
  ctx.fillText("Traço = meta da semana", PAD + 386, yRod + 34);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" });
  ctx.textAlign = "right";
  ctx.fillText(`${BRAND.name} · ${BRAND.product} · ${agora}`, W - PAD, yRod + 72);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem"))), "image/png");
  });
}

/** Gera uma ou mais imagens PNG prontas para compartilhar (várias se a lista for grande). */
export async function gerarRankingPng(op: OpcoesRanking): Promise<Blob[]> {
  if (document.fonts?.ready) await document.fonts.ready;
  const logo = await carregarImagem(LOGO_URL);
  const todas = ordenar(op.linhas, op.ordem);
  const escalaMax = Math.max(1, ...todas.map((l) => Math.max(l.realizado, l.meta)));
  const colunas = todas.length > 16 ? 2 : 1;
  const paginas = op.agrupar ? paginarPorCoordenador(todas, op.ordem, colunas) : paginarCorrido(todas);
  const blobs: Blob[] = [];
  for (let i = 0; i < paginas.length; i++) {
    blobs.push(await desenharPagina(logo, { ...op, linhas: todas }, todas, paginas[i]!, i, paginas.length, escalaMax, colunas));
  }
  return blobs;
}

/** Coordenadores presentes na lista (ordem alfabética; "Sem coordenador" por último). */
export function coordenadoresDe(linhas: LinhaRanking[]): string[] {
  const set = new Set(linhas.map((l) => l.coordenador?.trim() || SEM_COORDENADOR));
  return [...set].sort((a, b) => {
    if (a === SEM_COORDENADOR) return 1;
    if (b === SEM_COORDENADOR) return -1;
    return a.localeCompare(b, "pt-BR");
  });
}

export { SEM_COORDENADOR };
