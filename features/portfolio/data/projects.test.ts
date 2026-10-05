import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projects } from "./projects";

// Projetos em destaque com url que ficam sem print de propósito.
const SEM_PRINT_APROVADO: Record<string, string> = {
  "pixel-ai-hub": "print vetado pelo Vitor na revisão de 2026-10-05",
  dataclarityia: "site fora do ar na captura de 2026-10-05",
};

describe("projects cover", () => {
  it("todo cover aponta para um arquivo existente em public/images/projects", () => {
    const missing = projects
      .filter((p) => p.cover)
      .filter(
        (p) => !existsSync(path.join("public", "images", "projects", p.cover!)),
      )
      .map((p) => `${p.id} → ${p.cover}`);
    expect(missing).toEqual([]);
  });

  it("todo projeto em destaque com url tem print, salvo exceções registradas", () => {
    const semPrint = projects
      .filter(
        (p) => p.featured && p.url && !p.cover && !(p.id in SEM_PRINT_APROVADO),
      )
      .map((p) => p.id);
    expect(semPrint).toEqual([]);
  });
});
