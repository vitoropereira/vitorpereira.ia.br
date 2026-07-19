import { describe, it, expect, beforeEach } from "vitest";
import { writeSyndicationMarker, readFrontmatterField } from "./frontmatter.ts";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let file: string;
beforeEach(() => {
  file = join(mkdtempSync(join(tmpdir(), "post-")), "index.mdx");
  writeFileSync(file, `---\ntitle: "T"\ndraft: false\ntags: [agentes]\n---\n\nCorpo.\n`);
});

describe("frontmatter", () => {
  it("grava e lê o campo tabnews", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/x");
    expect(readFrontmatterField(file, "tabnews")).toBe("https://www.tabnews.com.br/vitor/x");
  });
  it("preserva os campos existentes", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/x");
    expect(readFrontmatterField(file, "title")).toBe("T");
  });
  it("preserva o corpo do post", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/x");
    expect(readFileSync(file, "utf8")).toContain("Corpo.");
  });
  it("lê campo sem aspas (ex.: draft)", () => {
    expect(readFrontmatterField(file, "draft")).toBe("false");
  });
  it("é idempotente: segunda chamada substitui, não duplica, a chave tabnews", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/first");
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/second");

    const raw = readFileSync(file, "utf8");
    const matches = raw.match(/^tabnews:/gm) ?? [];
    expect(matches).toHaveLength(1);
    expect(readFrontmatterField(file, "tabnews")).toBe("https://www.tabnews.com.br/vitor/second");
    expect(raw).toContain("Corpo.");
  });
});
