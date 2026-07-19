import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostMeta } from "./PostMeta";

// PostMeta is an async Server Component (uses next-intl/server). React's
// client renderer (used by jsdom/@testing-library/react in this test
// environment) can't invoke async component functions directly — only the
// RSC renderer can. So we mock next-intl/server (its real implementation
// throws "not supported in Client Components" outside a Next.js request)
// and resolve PostMeta's returned promise ourselves before handing the
// already-resolved element tree to `render()`.
vi.mock("next-intl/server", () => ({
  getLocale: async () => "pt",
  getTranslations:
    async () =>
    (key: string, values?: Record<string, unknown>) =>
      key === "readingTime" ? `${values?.minutes} min` : key,
}));

const base = {
  title: "T",
  date: "2026-07-18",
  readingTime: 3,
  tags: [],
  locale: "pt" as const,
};

async function renderWith(post: Record<string, unknown>) {
  const element = await PostMeta({ post: post as never });
  return render(element);
}

describe("PostMeta — link do TabNews", () => {
  it("mostra o link quando post.tabnews existe", async () => {
    await renderWith({ ...base, tabnews: "https://www.tabnews.com.br/vitor/x" });
    expect(screen.getByRole("link", { name: /tabnews/i })).toHaveAttribute(
      "href",
      "https://www.tabnews.com.br/vitor/x",
    );
  });

  it("não mostra o link quando post.tabnews não existe", async () => {
    await renderWith({ ...base });
    expect(screen.queryByRole("link", { name: /tabnews/i })).toBeNull();
  });
});
