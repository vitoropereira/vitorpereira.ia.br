# Phase 3 — Blog UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL:
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Ship the full blog reading experience. Listing page, post
individual page with TOC, tags pages, related posts, drafts in dev,
Giscus comments (opt-in by frontmatter), and a ⌘K command palette that
searches post titles/tags.

**Architecture:** Physical routes per locale. Post URL is 4 segments:
`/[year]/[month]/[day]/[slug]`. TOC extracted from MDX at render time by
parsing headings. Related posts by tag overlap. Giscus lazy-loaded via
Intersection Observer. Command palette uses `cmdk` (shadcn Command) +
Fuse.js for fuzzy search over a client-side index generated at build.

**Tech Stack:** Next.js 15 App Router, Velite (done in Phase 2),
next-mdx-remote, rehype-slug, Fuse.js, cmdk, Giscus.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— sections 6 (routes), 7 (blog features).

**Akita references:**

- Post template: `/Users/vop12/projects/akitaonrails.github.io/layouts/single.html`
  (TOC partial, max-w-6xl container, centered title, date line)
- Comments reference (Disqus iframe, we use Giscus instead):
  `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/components/comments.html`

**Prereq:** Phases 1 and 2 complete.

---

## File structure after this phase

```
app/
├── (site)/
│   ├── posts/page.tsx
│   ├── [year]/[month]/[day]/[slug]/page.tsx
│   ├── tags/[tag]/page.tsx
│   └── en/
│       ├── posts/page.tsx
│       ├── [year]/[month]/[day]/[slug]/page.tsx
│       └── tags/[tag]/page.tsx
features/blog/
├── components/
│   ├── PostBody.tsx        # from Phase 2
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── PostMeta.tsx
│   ├── PostToc.tsx
│   ├── RelatedPosts.tsx
│   ├── DraftBadge.tsx
│   ├── Pagination.tsx
│   └── GiscusComments.tsx
├── lib/
│   ├── toc.ts
│   └── searchIndex.ts
components/search/
├── CommandPalette.tsx
└── CommandPaletteTrigger.tsx
```

---

## Task 1: TOC extraction utility

**Files:**

- Create: `features/blog/lib/toc.ts`, `features/blog/lib/toc.test.ts`

- [ ] **Step 1: Write tests**

Create `features/blog/lib/toc.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test features/blog/lib/toc.test.ts
```

- [ ] **Step 3: Implement extractToc**

Create `features/blog/lib/toc.ts`:

````ts
export type TocItem = { level: 2 | 3 | 4; slug: string; text: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(raw: string): TocItem[] {
  const lines = raw.split("\n");
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3 | 4;
    const text = m[2].replace(/`/g, "").trim();
    items.push({ level, slug: slugify(text), text });
  }
  return items;
}
````

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test features/blog/lib/toc.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add features/blog/lib/toc.ts features/blog/lib/toc.test.ts
git commit -m "feat(blog): add TOC extraction utility with tests"
```

---

## Task 2: PostMeta component

**Files:**

- Create: `features/blog/components/PostMeta.tsx`

- [ ] **Step 1: Write component**

Create `features/blog/components/PostMeta.tsx`:

```tsx
import { getLocale, getTranslations } from "next-intl/server";
import type { Post } from "../types";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export async function PostMeta({ post }: { post: Post }) {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const date = new Date(post.date).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const tagBase = locale === "pt" ? "/tags" : "/en/tags";

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
      <em>{date}</em>
      <span>·</span>
      <span>{t("readingTime", { minutes: post.readingTime })}</span>
      {post.tags && post.tags.length > 0 && (
        <>
          <span>·</span>
          <ul className="flex gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <a
                  href={`${tagBase}/${encodeURIComponent(tag)}`}
                  className="hover:text-foreground"
                >
                  #{tag}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/components/PostMeta.tsx
git commit -m "feat(blog): add PostMeta component (date + reading time + tags)"
```

---

## Task 3: DraftBadge and PostToc components

**Files:**

- Create: `features/blog/components/DraftBadge.tsx`,
  `features/blog/components/PostToc.tsx`

- [ ] **Step 1: Write DraftBadge**

Create `features/blog/components/DraftBadge.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function DraftBadge() {
  const t = useTranslations("blog");
  return (
    <span className="inline-flex items-center rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      {t("draft")}
    </span>
  );
}
```

- [ ] **Step 2: Write PostToc**

Create `features/blog/components/PostToc.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "../lib/toc";
import { cn } from "@/lib/utils";

export function PostToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" },
    );
    for (const item of items) {
      const el = document.getElementById(item.slug);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="hidden text-sm lg:sticky lg:top-20 lg:block lg:self-start"
    >
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.slug}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors",
              it.level === 3 && "pl-3",
              it.level === 4 && "pl-6",
              active === it.slug && "text-foreground",
            )}
          >
            <a href={`#${it.slug}`}>{it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/blog/components/DraftBadge.tsx features/blog/components/PostToc.tsx
git commit -m "feat(blog): add DraftBadge and PostToc components"
```

---

## Task 4: GiscusComments component (lazy, opt-in)

**Files:**

- Create: `features/blog/components/GiscusComments.tsx`

- [ ] **Step 1: Install giscus React component**

```bash
pnpm add @giscus/react
```

- [ ] **Step 2: Write wrapper**

Create `features/blog/components/GiscusComments.tsx`:

```tsx
"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function GiscusComments() {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShow(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (
    !GISCUS_REPO ||
    !GISCUS_REPO_ID ||
    !GISCUS_CATEGORY ||
    !GISCUS_CATEGORY_ID
  ) {
    return null;
  }

  return (
    <div ref={ref} className="mt-16">
      {show && (
        <Giscus
          id="comments"
          repo={GISCUS_REPO as `${string}/${string}`}
          repoId={GISCUS_REPO_ID}
          category={GISCUS_CATEGORY}
          categoryId={GISCUS_CATEGORY_ID}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          lang={locale === "pt" ? "pt" : "en"}
          loading="lazy"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml features/blog/components/GiscusComments.tsx
git commit -m "feat(blog): add Giscus comments (lazy, opt-in via frontmatter)"
```

---

## Task 5: RelatedPosts component

**Files:**

- Create: `features/blog/components/RelatedPosts.tsx`

- [ ] **Step 1: Write component**

Create `features/blog/components/RelatedPosts.tsx`:

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRelatedPosts } from "../lib/queries";
import { posts as rawPosts } from "@/content";
import type { Post } from "../types";

export async function RelatedPosts({ post }: { post: Post }) {
  const all = rawPosts as unknown as Post[];
  const related = getRelatedPosts(post, all, 3);
  if (related.length === 0) return null;
  const t = await getTranslations("blog");

  return (
    <section className="mt-16 border-t pt-8">
      <h2 className="mb-4 font-sans text-lg font-semibold">
        {t("relatedPosts")}
      </h2>
      <ul className="space-y-2">
        {related.map((rp) => (
          <li key={rp.permalink}>
            <Link href={rp.permalink} className="text-primary hover:underline">
              {rp.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/components/RelatedPosts.tsx
git commit -m "feat(blog): add RelatedPosts component"
```

---

## Task 6: PostCard and PostList

**Files:**

- Create: `features/blog/components/PostCard.tsx`,
  `features/blog/components/PostList.tsx`

- [ ] **Step 1: Write PostCard**

Create `features/blog/components/PostCard.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Post } from "../types";
import { DraftBadge } from "./DraftBadge";

export async function PostCard({ post }: { post: Post }) {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const date = new Date(post.date).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const cover =
    post.cover && typeof post.cover === "object" && "src" in post.cover
      ? (post.cover as { src: string; width: number; height: number })
      : null;

  return (
    <article className="group grid gap-4 border-b py-6 md:grid-cols-[180px_1fr]">
      {cover ? (
        <Link href={post.permalink}>
          <Image
            src={cover.src}
            alt=""
            width={cover.width}
            height={cover.height}
            className="aspect-[3/2] rounded object-cover"
          />
        </Link>
      ) : (
        <div className="hidden md:block" />
      )}
      <div className="flex flex-col">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <time>{date}</time>
          <span>·</span>
          <span>{t("readingTime", { minutes: post.readingTime })}</span>
          {post.draft && (
            <>
              <span>·</span>
              <DraftBadge />
            </>
          )}
        </div>
        <h2 className="mt-2 font-serif text-2xl leading-tight font-bold">
          <Link href={post.permalink} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{post.excerpt}</p>
        {post.tags && post.tags.length > 0 && (
          <ul className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
            {post.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="bg-muted rounded px-2 py-0.5">
                #{tag}
              </li>
            ))}
            {post.tags.length > 3 && (
              <li className="bg-muted rounded px-2 py-0.5">
                +{post.tags.length - 3}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Write PostList**

Create `features/blog/components/PostList.tsx`:

```tsx
import { PostCard } from "./PostCard";
import type { Post } from "../types";

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">No posts yet.</p>
    );
  }
  return (
    <div className="divide-y">
      {posts.map((p) => (
        <PostCard key={p.permalink} post={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/blog/components/PostCard.tsx features/blog/components/PostList.tsx
git commit -m "feat(blog): add PostCard and PostList components"
```

---

## Task 7: Pagination component

**Files:**

- Create: `features/blog/components/Pagination.tsx`

- [ ] **Step 1: Write component**

Create `features/blog/components/Pagination.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  current,
  total,
  basePath,
}: {
  current: number;
  total: number;
  basePath: string;
}) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center gap-1">
      {current > 1 && (
        <Button variant="outline" size="sm" asChild>
          <Link
            href={current === 2 ? basePath : `${basePath}?page=${current - 1}`}
          >
            ←
          </Link>
        </Button>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === current ? "default" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={p === 1 ? basePath : `${basePath}?page=${p}`}>{p}</Link>
        </Button>
      ))}
      {current < total && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`${basePath}?page=${current + 1}`}>→</Link>
        </Button>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/components/Pagination.tsx
git commit -m "feat(blog): add Pagination component"
```

---

## Task 8: Listing page `/posts` (PT)

**Files:**

- Create: `app/(site)/posts/page.tsx`

- [ ] **Step 1: Write page**

Create `app/(site)/posts/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { Pagination } from "@/features/blog/components/Pagination";
import { PostList } from "@/features/blog/components/PostList";
import { siteConfig } from "@/lib/siteConfig";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const current = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const posts = getPostsByLocale("pt");
  const total = Math.max(1, Math.ceil(posts.length / siteConfig.postsPerPage));
  const offset = (current - 1) * siteConfig.postsPerPage;
  const pageItems = posts.slice(offset, offset + siteConfig.postsPerPage);
  const t = await getTranslations("nav");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight">
        {t("posts")}
      </h1>
      <PostList posts={pageItems} />
      <Pagination current={current} total={total} basePath="/posts" />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(site\)/posts/page.tsx
git commit -m "feat(blog): add /posts listing page (PT)"
```

---

## Task 9: Listing page `/en/posts`

**Files:**

- Create: `app/(site)/en/posts/page.tsx`

- [ ] **Step 1: Write page**

Create `app/(site)/en/posts/page.tsx` — same shape as PT but with locale
`"en"` and `basePath="/en/posts"`:

```tsx
import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { Pagination } from "@/features/blog/components/Pagination";
import { PostList } from "@/features/blog/components/PostList";
import { siteConfig } from "@/lib/siteConfig";

export default async function PostsPageEn({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const current = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const posts = getPostsByLocale("en");
  const total = Math.max(1, Math.ceil(posts.length / siteConfig.postsPerPage));
  const offset = (current - 1) * siteConfig.postsPerPage;
  const pageItems = posts.slice(offset, offset + siteConfig.postsPerPage);
  const t = await getTranslations("nav");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight">
        {t("posts")}
      </h1>
      <PostList posts={pageItems} />
      <Pagination current={current} total={total} basePath="/en/posts" />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(site\)/en/posts/page.tsx
git commit -m "feat(blog): add /en/posts listing page"
```

---

## Task 10: Post detail page PT `/[year]/[month]/[day]/[slug]`

**Files:**

- Create: `app/(site)/[year]/[month]/[day]/[slug]/page.tsx`

- [ ] **Step 1: Write page**

Create `app/(site)/[year]/[month]/[day]/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostBody } from "@/features/blog/components/PostBody";
import { PostMeta } from "@/features/blog/components/PostMeta";
import { PostToc } from "@/features/blog/components/PostToc";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";
import { GiscusComments } from "@/features/blog/components/GiscusComments";
import { DraftBadge } from "@/features/blog/components/DraftBadge";
import { extractToc } from "@/features/blog/lib/toc";

export async function generateStaticParams() {
  const posts = getPostsByLocale("pt", { includeDrafts: false });
  return posts.map((p) => {
    const [year, month, day, slug] = p.permalink.split("/").filter(Boolean);
    return { year, month, day, slug };
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug("pt", slug);
  if (!post) notFound();
  const toc = extractToc(post.body);

  return (
    <div className="mx-auto flex max-w-[88rem] gap-8 px-6 py-12 lg:grid lg:grid-cols-[1fr_220px]">
      <article className="mx-auto w-full max-w-6xl">
        <header className="text-center">
          {post.draft && (
            <div className="mb-2">
              <DraftBadge />
            </div>
          )}
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4">
            <PostMeta post={post} />
          </div>
        </header>
        <div className="bg-border my-12 h-px" />
        <PostBody post={post} />
        <RelatedPosts post={post} />
        {post.comments && <GiscusComments />}
      </article>
      <aside className="hidden lg:block">
        <PostToc items={toc} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(site)/[year]/[month]/[day]/[slug]/page.tsx"
git commit -m "feat(blog): add post detail page PT with TOC and related"
```

---

## Task 11: Post detail page EN

**Files:**

- Create: `app/(site)/en/[year]/[month]/[day]/[slug]/page.tsx`

- [ ] **Step 1: Write page**

Create the file — same as Task 10 but with locale `"en"`:

```tsx
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostBody } from "@/features/blog/components/PostBody";
import { PostMeta } from "@/features/blog/components/PostMeta";
import { PostToc } from "@/features/blog/components/PostToc";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";
import { GiscusComments } from "@/features/blog/components/GiscusComments";
import { DraftBadge } from "@/features/blog/components/DraftBadge";
import { extractToc } from "@/features/blog/lib/toc";

export async function generateStaticParams() {
  const posts = getPostsByLocale("en", { includeDrafts: false });
  return posts.map((p) => {
    // /en/YYYY/MM/DD/slug — we need [year, month, day, slug]
    const parts = p.permalink.split("/").filter(Boolean);
    const [, year, month, day, slug] = parts;
    return { year, month, day, slug };
  });
}

export default async function PostPageEn({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug("en", slug);
  if (!post) notFound();
  const toc = extractToc(post.body);

  return (
    <div className="mx-auto flex max-w-[88rem] gap-8 px-6 py-12 lg:grid lg:grid-cols-[1fr_220px]">
      <article className="mx-auto w-full max-w-6xl">
        <header className="text-center">
          {post.draft && (
            <div className="mb-2">
              <DraftBadge />
            </div>
          )}
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4">
            <PostMeta post={post} />
          </div>
        </header>
        <div className="bg-border my-12 h-px" />
        <PostBody post={post} />
        <RelatedPosts post={post} />
        {post.comments && <GiscusComments />}
      </article>
      <aside className="hidden lg:block">
        <PostToc items={toc} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(site)/en/[year]/[month]/[day]/[slug]/page.tsx"
git commit -m "feat(blog): add post detail page EN"
```

---

## Task 12: Tag pages `/tags/[tag]` (PT + EN)

**Files:**

- Create: `app/(site)/tags/[tag]/page.tsx`, `app/(site)/en/tags/[tag]/page.tsx`

- [ ] **Step 1: Write PT**

Create `app/(site)/tags/[tag]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAllTags, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostList } from "@/features/blog/components/PostList";
import { posts as rawPosts } from "@/content";
import type { Post } from "@/features/blog/types";

export async function generateStaticParams() {
  const tags = getAllTags(rawPosts as unknown as Post[], "pt");
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = getPostsByLocale("pt", { tag });
  if (posts.length === 0) notFound();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight">
        Posts com a tag <span className="text-primary">#{tag}</span>
      </h1>
      <PostList posts={posts} />
    </section>
  );
}
```

- [ ] **Step 2: Write EN**

Create `app/(site)/en/tags/[tag]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAllTags, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostList } from "@/features/blog/components/PostList";
import { posts as rawPosts } from "@/content";
import type { Post } from "@/features/blog/types";

export async function generateStaticParams() {
  const tags = getAllTags(rawPosts as unknown as Post[], "en");
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export default async function TagPageEn({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = getPostsByLocale("en", { tag });
  if (posts.length === 0) notFound();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight">
        Posts tagged <span className="text-primary">#{tag}</span>
      </h1>
      <PostList posts={posts} />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/tags/" "app/(site)/en/tags/"
git commit -m "feat(blog): add tag pages for PT and EN"
```

---

## Task 13: Build search index

**Files:**

- Create: `features/blog/lib/searchIndex.ts`

- [ ] **Step 1: Write search index builder**

Create `features/blog/lib/searchIndex.ts`:

```ts
import { posts as rawPosts } from "@/content";
import type { Post, Locale } from "../types";

export type SearchItem = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  permalink: string;
  date: string;
};

export function buildSearchIndex(locale: Locale): SearchItem[] {
  return (rawPosts as unknown as Post[])
    .filter((p) => p.locale === locale && !p.draft)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      tags: p.tags,
      permalink: p.permalink,
      date: new Date(p.date).toISOString(),
    }));
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/lib/searchIndex.ts
git commit -m "feat(search): add build-time search index generator"
```

---

## Task 14: CommandPalette component

**Files:**

- Create: `components/search/CommandPalette.tsx`,
  `components/search/CommandPaletteTrigger.tsx`

- [ ] **Step 1: Install Fuse.js**

```bash
pnpm add fuse.js
```

- [ ] **Step 2: Write CommandPalette**

Create `components/search/CommandPalette.tsx`:

```tsx
"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SearchItem } from "@/features/blog/lib/searchIndex";

export function CommandPalette({ index }: { index: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "tags", weight: 0.3 },
          { name: "excerpt", weight: 0.1 },
        ],
        includeScore: true,
        threshold: 0.35,
      }),
    [index],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = q
    ? fuse
        .search(q)
        .slice(0, 10)
        .map((r) => r.item)
    : index.slice(0, 10);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder={locale === "pt" ? "Buscar posts…" : "Search posts…"}
      />
      <CommandList>
        <CommandEmpty>
          {locale === "pt" ? "Nenhum resultado" : "No results"}
        </CommandEmpty>
        <CommandGroup heading={locale === "pt" ? "Posts" : "Posts"}>
          {results.map((item) => (
            <CommandItem
              key={item.permalink}
              value={`${item.title} ${item.tags.join(" ")}`}
              onSelect={() => {
                setOpen(false);
                router.push(item.permalink);
              }}
            >
              <span className="truncate">{item.title}</span>
              {item.tags.length > 0 && (
                <span className="text-muted-foreground ml-auto truncate text-xs">
                  {item.tags
                    .slice(0, 2)
                    .map((t) => `#${t}`)
                    .join(" ")}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

- [ ] **Step 3: Write trigger button**

Create `components/search/CommandPaletteTrigger.tsx`:

```tsx
"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandPaletteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button variant="ghost" size="icon" aria-label="Search" onClick={onOpen}>
      <Search className="h-4 w-4" />
    </Button>
  );
}
```

Note: the simplest wiring is to drop `<CommandPalette index={...} />` in
`(site)/layout.tsx` and let the `⌘K` handler open it. We'll do that in
Task 15.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml components/search/
git commit -m "feat(search): add CommandPalette with Fuse.js"
```

---

## Task 15: Wire CommandPalette into site layout

**Files:**

- Modify: `app/(site)/layout.tsx`, `app/(site)/en/layout.tsx`

- [ ] **Step 1: Inject index into layout**

Replace `app/(site)/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/search/CommandPalette";
import { buildSearchIndex } from "@/features/blog/lib/searchIndex";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const index = buildSearchIndex("pt");

  return (
    <NextIntlClientProvider messages={messages} locale="pt">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CommandPalette index={index} />
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Replace EN layout**

Replace `app/(site)/en/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CommandPalette } from "@/components/search/CommandPalette";
import { buildSearchIndex } from "@/features/blog/lib/searchIndex";

export default async function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const index = buildSearchIndex("en");

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
      <CommandPalette index={index} />
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/layout.tsx" "app/(site)/en/layout.tsx"
git commit -m "feat(search): wire CommandPalette into PT and EN layouts"
```

---

## Task 16: Harden middleware so dynamic post routes work

No changes required — the middleware from Phase 1 already excludes
`/_next`, `/api`, and static assets, and matches the post URLs. This
task just verifies.

- [ ] **Step 1: Manual smoke test**

```bash
pnpm dev
```

Visit:

- `http://localhost:3000/posts` — lists "Olá, mundo"
- `http://localhost:3000/2026/04/21/hello-world` — PT post with TOC on the
  right, Shiki code highlighting, Callout, Video
- `http://localhost:3000/en/posts` — lists "Hello, world"
- `http://localhost:3000/en/2026/04/21/hello-world` — EN version
- `http://localhost:3000/tags/meta` — shows the tagged post
- `⌘K` (or Ctrl+K) — opens palette, type "hello" → shows result, Enter →
  navigates

Stop server.

- [ ] **Step 2: Commit if no changes needed**

Skip commit if smoke test passes without edits.

---

## Task 17: Verify related-posts edge case and drafts

- [ ] **Step 1: Create a second post (draft)**

Create `content/posts/2026/04/22/only-pt-draft/index.mdx`:

```mdx
---
title: "Rascunho interno"
description: "Post em rascunho que só aparece em dev."
date: 2026-04-22T10:00:00-03:00
draft: true
tags: [meta]
---

Este post tem `draft: true` e só deve aparecer em desenvolvimento.
```

- [ ] **Step 2: Verify dev and prod behaviors**

```bash
pnpm dev
```

- [ ] Visit `/posts` in dev — draft appears with DRAFT badge
- [ ] Stop dev, run `pnpm build && pnpm start`
- [ ] Visit `/posts` in prod mode — draft does NOT appear

Stop server.

- [ ] **Step 3: Commit draft post**

```bash
git add content/posts/2026/04/22/
git commit -m "content: add draft-only example post"
```

---

## Task 18: Fix any accessibility or layout issues found

- [ ] **Step 1: Check keyboard navigation**

- [ ] Tab order in header works (logo → nav → lang → theme)
- [ ] Tab order in CommandPalette dialog works (input → items → close)
- [ ] Escape closes CommandPalette
- [ ] Focus is visible on all focusable elements

- [ ] **Step 2: Check Lighthouse Accessibility on `/` and `/posts`**

```bash
pnpm build && pnpm start
```

Open Chrome DevTools → Lighthouse → Accessibility. Target ≥90. Fix any
issues (missing aria-labels, contrast ratios in dark mode).

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "a11y: address Lighthouse findings on listing and post pages" # skip if no changes
```

---

## Task 19: Final checks for Phase 3

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: all pass. Visit every URL above one more time in the production
build via `pnpm start`.

- [ ] **Commit any final tweaks.**

---

## Definition of Done — Phase 3

- [ ] `/posts` and `/en/posts` list posts with pagination
- [ ] `/YYYY/MM/DD/slug` and `/en/YYYY/MM/DD/slug` render the full post
- [ ] TOC appears in right sidebar on desktop, syncs with scroll
- [ ] Related posts section shows up to 3
- [ ] Giscus only appears when `comments: true` in frontmatter AND env
      vars are set
- [ ] Drafts visible in dev with badge, hidden in prod
- [ ] `/tags/[tag]` and `/en/tags/[tag]` work for each tag
- [ ] ⌘K opens command palette, searches titles/tags, Enter navigates
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass
- [ ] Lighthouse Accessibility ≥90 on listing and post pages
