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

// DraftBadge usa useTranslations (client); sem provider, mockamos.
vi.mock("next-intl", () => ({ useTranslations: () => () => "DRAFT" }));

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
    const fb = container.querySelector("[data-cover-fallback]");
    expect(fb).not.toBeNull();
    expect(fb?.querySelector("img")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(fb).toHaveTextContent("ia");
  });

  it("link da capa sai do foco e o card tem um único link focável", () => {
    const { container } = render(
      <PostCard post={{ ...base, cover } as never} {...common} />,
    );
    const coverLink = container.querySelector("img")!.closest("a")!;
    expect(coverLink).toHaveAttribute("tabindex", "-1");
    expect(coverLink).toHaveAttribute("aria-hidden", "true");
    // aria-hidden tira a capa da árvore de acessibilidade: sobra só o título
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("rascunho mostra o DraftBadge", () => {
    render(<PostCard post={{ ...base, draft: true } as never} {...common} />);
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("locale en formata a data em inglês", () => {
    render(
      <PostCard
        post={{ ...base, date: "2026-10-15T12:00:00Z" } as never}
        locale="en"
        readingTimeLabel="4 min read"
      />,
    );
    expect(screen.getByText(/Oct/)).toBeInTheDocument();
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

  it("featuredFirst: primeiro card fora do Reveal, os demais dentro", async () => {
    const { container } = render(
      await PostList({ posts: posts as never, featuredFirst: true }),
    );
    const arts = container.querySelectorAll("article");
    expect(arts[0].closest("[data-reveal]")).toBeNull();
    expect(arts[1].closest("[data-reveal]")).not.toBeNull();
    expect(arts[2].closest("[data-reveal]")).not.toBeNull();
  });

  it("sem featuredFirst nenhum é featured", async () => {
    const { container } = render(await PostList({ posts: posts as never }));
    expect(container.querySelectorAll("article.md\\:flex-row")).toHaveLength(0);
  });
});

describe("PostCard headingAs", () => {
  it("renderiza h3 quando pedido e h2 por padrão", () => {
    const { rerender } = render(<PostCard post={base as never} {...common} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    rerender(<PostCard post={base as never} {...common} headingAs="h3" />);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });
});
