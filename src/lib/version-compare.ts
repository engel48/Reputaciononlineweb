/**
 * Compara dos versiones semánticas "x.y.z".
 * Devuelve -1 si a < b, 0 si iguales, 1 si a > b.
 */
export function compareVersions(a: string, b: string): number {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}
