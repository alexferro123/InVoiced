export const fmt = (n: number | undefined): string =>
  Number(n || 0).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

export const fmtK = (n: number | undefined): string => {
  const v = Number(n || 0);
  return v >= 1000 ? (v / 1000).toFixed(1) + "k €" : v.toFixed(0) + " €";
};

export const parseD = (s: string | undefined | null): Date | null => {
  if (!s) return null;
  const p = s.split("/");
  if (p.length < 3) return null;
  const d = new Date(+p[2], +p[1] - 1, +p[0]);
  return isNaN(d.getTime()) ? null : d;
};

export const todayStr = (): string => new Date().toLocaleDateString("pt-PT");

export const nifClean = (n: string | undefined): string =>
  (n || "").replace(/\D/g, "");

export const isoToDisplay = (s: string | undefined): string => {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
};
