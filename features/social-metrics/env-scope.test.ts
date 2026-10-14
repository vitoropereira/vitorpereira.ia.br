// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// A URL do papel social_reader é segredo de servidor. Este teste falha se ela
// (ou o módulo que a lê) aparecer num arquivo "use client", ou se alguém a
// expuser como NEXT_PUBLIC_, que o Next embute no bundle do navegador.

const root = process.cwd();
const ESTE = relative(root, __filename);

type Arquivo = { caminho: string; conteudo: string };

const ENV = /\bSOCIAL_READER_DATABASE_(URL|CA)\b/;
const MODULO_SERVIDOR =
  /social-metrics\/queries\/(readerDb|painel)\b|\.\/(readerDb|painel)\b/;
const PUBLICA = /NEXT_PUBLIC_SOCIAL_READER|NEXT_PUBLIC_\w*SOCIAL\w*DATABASE/;

const ehClient = (src: string) =>
  /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(src);

export function violacoes(arquivos: Arquivo[]): string[] {
  const achados: string[] = [];
  for (const { caminho, conteudo } of arquivos) {
    if (PUBLICA.test(conteudo)) achados.push(`${caminho}: env pública`);
    if (!ehClient(conteudo)) continue;
    if (ENV.test(conteudo)) achados.push(`${caminho}: "use client" cita a env`);
    if (MODULO_SERVIDOR.test(conteudo)) {
      achados.push(`${caminho}: "use client" importa módulo do servidor`);
    }
  }
  return achados;
}

const IGNORAR = new Set([
  "node_modules",
  ".next",
  ".git",
  ".velite",
  ".vercel",
]);
const TEXTO = /\.(tsx?|jsx?|mjs|cjs|json|ya?ml|md|mdx|sql)$/;

function walk(dir: string): string[] {
  let nomes: string[];
  try {
    nomes = readdirSync(dir);
  } catch {
    return [];
  }
  return nomes.flatMap((nome) => {
    if (IGNORAR.has(nome)) return [];
    const full = join(dir, nome);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const ler = (f: string): Arquivo => ({
  caminho: relative(root, f),
  conteudo: readFileSync(f, "utf8"),
});

describe("violacoes (o detector funciona)", () => {
  it("arquivo use client que cita a env dá 1 violação", () => {
    expect(
      violacoes([
        {
          caminho: "x.tsx",
          conteudo: `"use client";\nconst u = process.env.SOCIAL_READER_DATABASE_URL;`,
        },
      ]),
    ).toHaveLength(1);
  });

  it("use client que importa readerDb é violação", () => {
    expect(
      violacoes([
        {
          caminho: "x.tsx",
          conteudo: `// c\n'use client'\nimport { getReaderDb } from "@/features/social-metrics/queries/readerDb";`,
        },
      ]),
    ).toHaveLength(1);
  });

  it("env NEXT_PUBLIC_ é violação em qualquer arquivo", () => {
    expect(
      violacoes([
        {
          caminho: ".env.example",
          conteudo: "NEXT_PUBLIC_SOCIAL_READER_DATABASE_URL=",
        },
      ]),
    ).toHaveLength(1);
  });

  it("arquivo de servidor pode citar a env", () => {
    expect(
      violacoes([
        { caminho: "s.ts", conteudo: "env.SOCIAL_READER_DATABASE_URL" },
      ]),
    ).toEqual([]);
  });
});

describe("varredura real", () => {
  it("nenhum arquivo use client em app/components/features/lib alcança a env", () => {
    const arquivos = ["app", "components", "features", "lib"]
      .flatMap((d) => walk(join(root, d)))
      .filter((f) => /\.(tsx?|jsx?)$/.test(f))
      .map(ler)
      // este arquivo cita os padrões proibidos por definição
      .filter((a) => a.caminho !== ESTE);
    expect(arquivos.some((a) => ehClient(a.conteudo))).toBe(true);
    expect(violacoes(arquivos)).toEqual([]);
  });

  it("nenhum arquivo do repo (inclusive .env.example) declara a env como NEXT_PUBLIC_", () => {
    const arquivos = walk(root)
      .filter((f) => TEXTO.test(f) || basename(f).startsWith(".env"))
      .map(ler)
      .filter((a) => a.caminho !== ESTE);
    expect(arquivos.some((a) => a.caminho === ".env.example")).toBe(true);
    expect(violacoes(arquivos)).toEqual([]);
  });
});
