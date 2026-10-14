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

  it("/admin não carrega GA, Clarity nem banner de consent", () => {
    const files = walk(join(root, "app", "admin")).filter(isSource);
    expect(files.length).toBeGreaterThan(0);

    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, rel(f)).not.toMatch(
        /GAScript|ClarityScript|ConsentBannerMount/,
      );
      expect(src, rel(f)).not.toContain("googletagmanager");
      expect(src, rel(f)).not.toContain("clarity.ms");
      expect(src, rel(f)).not.toMatch(/@\/components\/(analytics|layout)\//);
    }
  });

  it("o layout do /admin renderiza sem nenhum <script>", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { default: AdminLayout } = await import("@/app/admin/layout");
    const html = renderToStaticMarkup(
      createElement(AdminLayout, null, createElement("p", null, "x")),
    );
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toContain("googletagmanager");
    expect(html).not.toContain("clarity.ms");
  });

  it("nenhum import de @vercel/analytics ou @vercel/speed-insights", () => {
    // o padrão é só GA4 + Clarity sob consentimento; Vercel Analytics e
    // Speed Insights coletam sem passar pelo banner e não voltam.
    const proibido = /@vercel\/(analytics|speed-insights)/;
    const alvos = [
      ...["app", "components", "features", "lib", "scripts"].flatMap((d) =>
        walk(join(root, d)),
      ),
      join(root, "proxy.ts"),
      join(root, "velite.config.ts"),
    ]
      .filter((f) => /\.tsx?$/.test(f))
      // este arquivo cita os nomes proibidos por definição
      .filter(
        (f) =>
          rel(f) !== join("components", "analytics", "analytics-scope.test.ts"),
      );

    const offenders = alvos
      .filter((f) => {
        try {
          return proibido.test(readFileSync(f, "utf8"));
        } catch {
          return false;
        }
      })
      .map(rel);

    expect(offenders).toEqual([]);

    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const deps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });
    expect(deps.filter((d) => proibido.test(d))).toEqual([]);
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
