import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name === ".next") return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const isSource = (f: string) => /\.tsx?$/.test(f) && !/\.test\./.test(f);
const rel = (f: string) => relative(root, f);

describe("escopo do analytics", () => {
  it("só o layout do site importa GAScript e ClarityScript", () => {
    const importers = [
      ...walk(join(root, "app")),
      ...walk(join(root, "components")),
      ...walk(join(root, "features")),
      ...walk(join(root, "lib")),
    ]
      .filter(isSource)
      .filter((f) =>
        /\b(GAScript|ClarityScript)\b/.test(readFileSync(f, "utf8")),
      )
      .map(rel)
      // os próprios componentes se declaram
      .filter(
        (f) => !/components\/analytics\/(GA|Clarity)Script\.tsx$/.test(f),
      );

    expect(importers).toEqual([join("app", "(site)", "layout.tsx")]);
  });

  it("/card e /qr não carregam GA nem Clarity", () => {
    const files = [
      ...walk(join(root, "app", "card")),
      ...walk(join(root, "app", "qr")),
    ].filter(isSource);

    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, rel(f)).not.toMatch(/GAScript|ClarityScript/);
      expect(src, rel(f)).not.toContain("googletagmanager");
      expect(src, rel(f)).not.toContain("clarity.ms");
    }
  });

  it("nenhum ID literal do GA no código", () => {
    const offenders = ["app", "components", "features", "lib"]
      .flatMap((d) => walk(join(root, d)))
      .filter(isSource)
      .filter((f) => /\bG-[A-Z0-9]{6,}\b/.test(readFileSync(f, "utf8")))
      .map(rel);

    expect(offenders).toEqual([]);
  });
});
