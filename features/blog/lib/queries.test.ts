import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import {
  filterPublishedByLocale,
  getAllTags,
  sortByDateDesc,
  getRelatedPosts,
} from "./queries";

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
      filterPublishedByLocale(all, "pt", false).map((p) => p.slug),
    ).toEqual(["a"]);
  });

  it("includes drafts when includeDrafts=true", () => {
    const all = [
      make({ slug: "a", locale: "pt" }),
      make({ slug: "c", locale: "pt", draft: true }),
    ];
    expect(
      filterPublishedByLocale(all, "pt", true)
        .map((p) => p.slug)
        .sort(),
    ).toEqual(["a", "c"]);
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
