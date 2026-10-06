import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostCard } from "./PostCard";
import { PostList } from "./PostList";

// PostList é async (next-intl/server). O renderer client do jsdom não invoca
// componente async, então mockamos next-intl/server e resolvemos a promise
// aqui, como no PostMeta.test. PostCard é síncrono e recebe locale/label por
// props, por isso é testado direto.
vi.mock("next-intl/server", () => ({
  getLocale: async () => "pt",
  getTranslations:
    async () => (key: string, values?: Record<string, unknown>) =>
      key === "readingTime" ? `${values?.minutes} min` : key,
}));

const base = {
  title: "Meu post",
  permalink: "/2026/04/21/meu-post",
  date: "2026-04-21",
  readingTime: 4,
  excerpt: "Resumo",
  tags: ["ia", "next"],
  locale: "pt" as const,
};
const common = { locale: "pt" as const, readingTimeLabel: "4 min" };
const cover = { src: "/c.png", width: 1200, height: 630 };

describe("PostCard", () => {
  it("com capa renderiza img e link do título para o permalink", () => {
    const { container } = render(
      <PostCard post={{ ...base, cover } as never} {...common} />,
    );
    expect(container.querySelector("img")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Meu post" })).toHaveAttribute(
      "href",
      base.permalink,
    );
  });

  it("sem capa renderiza fallback sem img, com a primeira tag", () => {
    const { container } = render(<PostCard post={base as never} {...common} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getAllByText("ia").length).toBeGreaterThan(0);
  });

  it("featured aplica layout horizontal em md+", () => {
    const { container } = render(
      <PostCard post={base as never} variant="featured" {...common} />,
    );
    expect(container.querySelector("article")?.className).toContain(
      "md:flex-row",
    );
  });

  it("default é vertical", () => {
    const { container } = render(<PostCard post={base as never} {...common} />);
    expect(container.querySelector("article")?.className).not.toContain(
      "md:flex-row",
    );
  });
});

describe("PostList", () => {
  const posts = [1, 2, 3].map((n) => ({
    ...base,
    title: `P${n}`,
    permalink: `/p${n}`,
  }));

  it("featuredFirst marca só o primeiro como featured", async () => {
    const { container } = render(
      await PostList({ posts: posts as never, featuredFirst: true }),
    );
    const feat = container.querySelectorAll("article.md\\:flex-row");
    expect(feat).toHaveLength(1);
    expect(container.querySelectorAll("article")[0]).toBe(feat[0]);
  });

  it("sem featuredFirst nenhum é featured", async () => {
    const { container } = render(await PostList({ posts: posts as never }));
    expect(container.querySelectorAll("article.md\\:flex-row")).toHaveLength(0);
  });
});
