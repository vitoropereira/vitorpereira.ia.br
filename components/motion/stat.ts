export type ParsedStat = {
  prefix: string;
  value: number;
  decimals: number;
  separator: "," | ".";
  suffix: string;
};

// Aceita "70+", "~700", "3,6M+": prefixo não numérico, um número com no
// máximo um separador decimal, e o resto como sufixo.
const STAT = /^(\D*?)(\d+)(?:([.,])(\d+))?(.*)$/;

export function parseStat(text: string): ParsedStat | null {
  const m = STAT.exec(text);
  if (!m) return null;
  const [, prefix, int, sep, frac, suffix] = m;
  const decimals = frac ? frac.length : 0;
  return {
    prefix: prefix ?? "",
    value: Number(`${int}${frac ? `.${frac}` : ""}`),
    decimals,
    separator: sep === "." ? "." : ",",
    suffix: suffix ?? "",
  };
}

export function formatStat(n: number, p: ParsedStat): string {
  const fixed = n.toFixed(p.decimals);
  const body = p.decimals ? fixed.replace(".", p.separator) : fixed;
  return `${p.prefix}${body}${p.suffix}`;
}
