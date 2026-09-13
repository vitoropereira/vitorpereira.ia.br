import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { planCoverFrontmatter, resolveApiKey, validateModeCompatibility, type Options } from "./gen-cover.ts";

const keyNames = ["GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY"] as const;
const tempDirs: string[] = [];

function clearImageKeyAliases(): void {
  for (const name of keyNames) delete process.env[name];
}

async function tempPost(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "gen-cover-"));
  tempDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(dir, name), content);
  }
  return dir;
}

function options(overrides: Partial<Options> = {}): Options {
  return {
    refs: [],
    pro: false,
    size: { width: 1672, height: 941 },
    sizeSpecified: false,
    listModels: false,
    dryRun: false,
    force: false,
    allowModalityRetry: false,
    attachFrontmatter: false,
    ...overrides,
  };
}

afterEach(async () => {
  clearImageKeyAliases();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveApiKey", () => {
  it("aceita o alias histórico GOOGLE_GEMINI_API_KEY", () => {
    process.env.GOOGLE_GEMINI_API_KEY = "historical-key";

    expect(resolveApiKey()).toEqual({ value: "historical-key", source: "GOOGLE_GEMINI_API_KEY" });
  });

  it("aceita GEMINI_API_KEY e mantém GOOGLE_API_KEY como prioridade canônica", () => {
    process.env.GEMINI_API_KEY = "sdk-key";
    expect(resolveApiKey()).toEqual({ value: "sdk-key", source: "GEMINI_API_KEY" });

    process.env.GOOGLE_API_KEY = "site-key";
    expect(resolveApiKey()).toEqual({ value: "site-key", source: "GOOGLE_API_KEY" });
  });

  it("não inventa credencial quando nenhum alias está configurado", () => {
    expect(resolveApiKey()).toEqual({});
  });
});

describe("validateModeCompatibility", () => {
  it("mantém --list-models isolado de qualquer fluxo que possa gerar ou escrever", () => {
    expect(() => validateModeCompatibility(options({ listModels: true }))).not.toThrow();
    expect(() => validateModeCompatibility(options({ listModels: true, attachFrontmatter: true }))).toThrow(
      "--list-models é exclusivo",
    );
    expect(() => validateModeCompatibility(options({ listModels: true, dryRun: true }))).toThrow("--dry-run");
    expect(() => validateModeCompatibility(options({ listModels: true, post: "content/post" }))).toThrow("--post");
  });

  it.each(["--prompt", "--prompt-file", "--post", "--out", "--ref", "--model", "--size"])(
    "rejeita valor vazio em %s antes de chegar à credencial/API",
    (flag) => {
      const run = spawnSync(
        process.execPath,
        ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/gen-cover.ts", "--list-models", flag, ""],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(run.status).toBe(1);
      expect(`${run.stdout}\n${run.stderr}`).toContain(`Valor vazio para ${flag}`);
    },
  );
});

describe("planCoverFrontmatter", () => {
  it("falha antes de qualquer escrita quando o par PT/EN tem cover divergente", async () => {
    const pt = '---\ntitle: "PT"\n---\ntexto\n';
    const en = '---\ntitle: "EN"\ncover: "./assets/other.webp"\n---\ntext\n';
    const post = await tempPost({ "index.mdx": pt, "index.en.mdx": en });

    await expect(planCoverFrontmatter(post, path.join(post, "assets", "cover.webp"))).rejects.toThrow(
      "Já existe cover diferente",
    );
    await expect(readFile(path.join(post, "index.mdx"), "utf8")).resolves.toBe(pt);
    await expect(readFile(path.join(post, "index.en.mdx"), "utf8")).resolves.toBe(en);
  });

  it("planeja a atualização completa de PT/EN sem escrever no preflight", async () => {
    const pt = '---\ntitle: "PT"\n---\ntexto\n';
    const en = '---\ntitle: "EN"\n---\ntext\n';
    const post = await tempPost({ "index.mdx": pt, "index.en.mdx": en });

    const updates = await planCoverFrontmatter(post, path.join(post, "assets", "cover.webp"));

    expect(updates).toHaveLength(2);
    expect(updates.map((update) => update.updated)).toEqual(
      expect.arrayContaining([expect.stringContaining('cover: "./assets/cover.webp"')]),
    );
    await expect(readFile(path.join(post, "index.mdx"), "utf8")).resolves.toBe(pt);
    await expect(readFile(path.join(post, "index.en.mdx"), "utf8")).resolves.toBe(en);
  });
});
