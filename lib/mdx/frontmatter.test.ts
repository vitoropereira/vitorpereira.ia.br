import { describe, it, expect, beforeEach } from "vitest";
import { writeSyndicationMarker, readFrontmatterField } from "./frontmatter.ts";
import { writeFileSync, mkdtempSync } from "node:fs";
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
});
