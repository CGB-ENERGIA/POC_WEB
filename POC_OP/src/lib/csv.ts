/**
 * Exportação em CSV para abrir direto no Excel em português: separador ";", UTF-8 com BOM (acentos certos),
 * campos entre aspas e quebras de linha preservadas.
 */

/** Texto que o Excel interpretaria como fórmula ganha um apóstrofo na frente. */
function protegerFormula(texto: string): string {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

function campo(valor: string | number | null | undefined): string {
  const texto = protegerFormula(valor === null || valor === undefined ? "" : String(valor));
  return `"${texto.replace(/"/g, '""')}"`;
}

export function montarCsv(cabecalho: string[], linhas: (string | number | null | undefined)[][]): string {
  const todas = [cabecalho, ...linhas];
  return todas.map((l) => l.map(campo).join(";")).join("\r\n");
}

/** Baixa o CSV no navegador. */
export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number | null | undefined)[][]): void {
  const blob = new Blob(["﻿", montarCsv(cabecalho, linhas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
