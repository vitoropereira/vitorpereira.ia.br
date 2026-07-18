import { describe, it, expect } from "vitest";
import { permalinkFromPath } from "./load-post.ts";

describe("permalinkFromPath", () => {
  it("deriva o permalink do caminho do post", () => {
    expect(permalinkFromPath("content/posts/2026/07/18/arquitetura-mental/index.mdx")).toBe("/2026/07/18/arquitetura-mental");
  });
  it("aceita caminho absoluto", () => {
    expect(permalinkFromPath("/x/y/content/posts/2026/05/31/ancora/index.mdx")).toBe("/2026/05/31/ancora");
  });
  it("rejeita caminho que não é post PT", () => {
    expect(() => permalinkFromPath("content/posts/2026/07/18/x/index.en.mdx")).toThrow(/válido/);
  });
});
