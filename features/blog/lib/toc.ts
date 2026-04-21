export type TocItem = { level: 2 | 3 | 4; slug: string; text: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(raw: string): TocItem[] {
  const lines = raw.split("\n");
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3 | 4;
    const text = m[2].replace(/`/g, "").trim();
    items.push({ level, slug: slugify(text), text });
  }
  return items;
}
