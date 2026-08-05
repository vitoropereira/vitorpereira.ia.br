import { describe, expect, it, vi } from "vitest";
import type { Post } from "../types";
import {
  filterPublishedByLocale,
  getAllTags,
  sortByDateDesc,
  getRelatedPosts,
  getPostBySlug,
} from "./queries";

vi.mock("@/content", () => ({
  posts: [
    { locale: "pt", slug: "published", draft: false, date: "2020-01-01" },
    { locale: "pt", slug: "secret", draft: true, date: "2020-01-01" },
    // publicado, mas com data lá na frente — agendado, não deve vazar
    { locale: "pt", slug: "agendado", draft: false, date: "2099-01-01" },
  ],
}));

const NOW = new Date("2026-08-05T12:00:00Z");

const make = (overrides: Partial<Post> = {}): Post =>
  ({
    slug: "s",
    locale: "pt",
    title: "T",
    description: "D",
    date: "2026-01-01",
    draft: false,
    tags: [],
    comments: false,
    body: "",
    permalink: "/2026/01/01/s",
    readingTime: 3,
    excerpt: "e",
    ...overrides,
  }) as unknown as Post;

describe("filterPublishedByLocale", () => {
  it("keeps only non-draft posts of the locale", () => {
    const all = [
      make({ slug: "a", locale: "pt" }),
      make({ slug: "b", locale: "en" }),
      make({ slug: "c", locale: "pt", draft: true }),
    ];
    expect(
      filterPublishedByLocale(all, "pt", false, NOW).map((p) => p.slug),
    ).toEqual(["a"]);
  });

  it("includes drafts when preview=true", () => {
    const all = [
      make({ slug: "a", locale: "pt" }),
      make({ slug: "c", locale: "pt", draft: true }),
    ];
    expect(
      filterPublishedByLocale(all, "pt", true, NOW)
        .map((p) => p.slug)
        .sort(),
    ).toEqual(["a", "c"]);
  });

  it("esconde post agendado (data futura) em produção", () => {
    const all = [
      make({ slug: "hoje", date: "2026-08-01" }),
      make({ slug: "amanha", date: "2026-08-30" }),
    ];
    expect(
      filterPublishedByLocale(all, "pt", false, NOW).map((p) => p.slug),
    ).toEqual(["hoje"]);
  });

  it("mostra agendado em preview (dev)", () => {
    const all = [
      make({ slug: "hoje", date: "2026-08-01" }),
      make({ slug: "amanha", date: "2026-08-30" }),
    ];
    expect(
      filterPublishedByLocale(all, "pt", true, NOW)
        .map((p) => p.slug)
        .sort(),
    ).toEqual(["amanha", "hoje"]);
  });
});

describe("sortByDateDesc", () => {
  it("sorts newest first", () => {
    const a = make({ slug: "a", date: "2026-01-01" });
    const b = make({ slug: "b", date: "2026-03-01" });
    const c = make({ slug: "c", date: "2026-02-01" });
    expect(sortByDateDesc([a, b, c]).map((p) => p.slug)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });
});

describe("getAllTags", () => {
  it("returns unique tags from locale-filtered posts", () => {
    const all = [
      make({ slug: "a", locale: "pt", tags: ["x", "y"] }),
      make({ slug: "b", locale: "pt", tags: ["y", "z"] }),
      make({ slug: "c", locale: "en", tags: ["w"] }),
    ];
    expect(getAllTags(all, "pt").sort()).toEqual(["x", "y", "z"]);
  });
});

describe("getRelatedPosts", () => {
  it("ranks by tag overlap and falls back to recency", () => {
    const base = make({
      slug: "base",
      tags: ["a", "b"],
      date: "2026-05-01",
    });
    const m2 = make({ slug: "m2", tags: ["a", "b"], date: "2026-04-01" });
    const m1 = make({ slug: "m1", tags: ["a"], date: "2026-03-01" });
    const newer = make({ slug: "newer", tags: ["x"], date: "2026-04-15" });
    const all = [base, m2, m1, newer];
    const rel = getRelatedPosts(base, all, 3).map((p) => p.slug);
    expect(rel[0]).toBe("m2");
    expect(rel[1]).toBe("m1");
    expect(rel[2]).toBe("newer");
  });
});

describe("getPostBySlug", () => {
  it("excludes drafts when preview is false (production behavior)", () => {
    expect(getPostBySlug("pt", "secret", { preview: false })).toBeUndefined();
    expect(getPostBySlug("pt", "published", { preview: false })?.slug).toBe(
      "published",
    );
  });

  it("returns drafts when preview is true (dev behavior)", () => {
    expect(getPostBySlug("pt", "secret", { preview: true })?.slug).toBe(
      "secret",
    );
  });

  // Regressão: URL direta de post agendado tem que 404 em produção, igual draft.
  it("excludes scheduled posts when preview is false", () => {
    expect(getPostBySlug("pt", "agendado", { preview: false })).toBeUndefined();
  });

  it("returns scheduled posts when preview is true", () => {
    expect(getPostBySlug("pt", "agendado", { preview: true })?.slug).toBe(
      "agendado",
    );
  });
});

describe("getAllTags", () => {
  it("ignora tags que só existem em post agendado", () => {
    const all = [
      make({ slug: "a", tags: ["publicada"], date: "2026-08-01" }),
      make({ slug: "b", tags: ["futura"], date: "2026-08-30" }),
    ];
    expect(getAllTags(all, "pt", NOW)).toEqual(["publicada"]);
  });
});

describe("getRelatedPosts", () => {
  it("não sugere post agendado", () => {
    const base = make({ slug: "base", tags: ["x"], date: "2026-08-01" });
    const agendado = make({ slug: "agendado", tags: ["x"], date: "2026-08-30" });
    const publicado = make({ slug: "pub", tags: ["x"], date: "2026-07-01" });
    const rel = getRelatedPosts(base, [base, agendado, publicado], 3, NOW);
    expect(rel.map((p) => p.slug)).toEqual(["pub"]);
  });
});
