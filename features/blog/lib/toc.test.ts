import { describe, expect, it } from "vitest";
import { extractToc } from "./toc";

describe("extractToc", () => {
  it("extracts H2 and H3 with ids and text", () => {
    const mdx = `
# Skipped H1

Introduction

## Getting started

Para.

### Install

Para.

## Usage

## Edge cases
`;
    const toc = extractToc(mdx);
    expect(toc).toEqual([
      { level: 2, slug: "getting-started", text: "Getting started" },
      { level: 3, slug: "install", text: "Install" },
      { level: 2, slug: "usage", text: "Usage" },
      { level: 2, slug: "edge-cases", text: "Edge cases" },
    ]);
  });

  it("handles accents and punctuation in slug", () => {
    const mdx = `## Olá, mundo!`;
    expect(extractToc(mdx)).toEqual([
      { level: 2, slug: "ola-mundo", text: "Olá, mundo!" },
    ]);
  });

  it("skips headings inside fenced code blocks", () => {
    const mdx = `## Real heading

\`\`\`md
## Not a heading
\`\`\`

## Another real heading`;
    const toc = extractToc(mdx);
    expect(toc).toEqual([
      { level: 2, slug: "real-heading", text: "Real heading" },
      { level: 2, slug: "another-real-heading", text: "Another real heading" },
    ]);
  });
});
