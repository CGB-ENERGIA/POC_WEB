/** Menor (mais antiga) das datas ISO informadas, ignorando vazias. */
export function menorData(...datas: (string | null | undefined)[]): string | undefined {
  const validas = datas.filter((d): d is string => !!d);
  return validas.length ? validas.reduce((a, b) => (a < b ? a : b)) : undefined;
}
