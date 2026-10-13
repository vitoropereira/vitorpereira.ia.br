import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// O repo vai virar privado: permalink do GitHub nos posts viraria link quebrado
// pro leitor. O trecho de código tem que estar inline no post.
const PRIVATE_REPO_URL = "github.com/vitoropereira/vitorpereira.ia.br";
const CONTENT_DIR = path.resolve(__dirname, "..");
const SELF = path.resolve(__filename);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(mdx|md|txt)$/.test(entry.name) ? [full] : [];
  });
}

describe("conteúdo sem links para o repo privado", () => {
  it("nenhum arquivo de content/ aponta para o repositório do site", () => {
    const offenders = walk(CONTENT_DIR)
      .filter((file) => file !== SELF)
      .filter((file) => readFileSync(file, "utf8").includes(PRIVATE_REPO_URL))
      .map((file) => path.relative(CONTENT_DIR, file));

    expect(
      offenders,
      `Arquivos com link para o repo:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
