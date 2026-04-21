# Phase 2 — Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL:
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Set up Velite to validate MDX frontmatter and index posts, with
bilingual conventions (`index.mdx` = PT, `index.en.mdx` = EN). Render with
`next-mdx-remote/rsc` (server components, no runtime eval), Shiki syntax
highlighting, and a registry of custom MDX components (Callout, Video,
Image wrapper, Tabs). At the end, one example post renders in PT and EN
with working code highlighting and all custom components.

**Architecture:** Velite reads `content/posts/YYYY/MM/DD/slug/*.mdx`,
produces a typed collection in `.velite/`, exposed via `@/content` alias.
We keep the **raw MDX body** (not compiled) in the collection and use
`next-mdx-remote/rsc` `<MDXRemote>` at render time, which applies our
remark/rehype plugin pipeline safely in React Server Components.

**Tech Stack:** Velite, Zod, next-mdx-remote, unified/remark/rehype,
rehype-pretty-code, Shiki, react-tweet.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— spec sections 5 (content pipeline) and 2 (Akita conventions).

**Akita references:**
- Post frontmatter: `/Users/vop12/projects/akitaonrails.github.io/content/2026/04/18/omarchy-no-thinkpad-t14-gen-6/index.md` (read first ~15 lines)
- YouTube shortcode: `/Users/vop12/projects/akitaonrails.github.io/layouts/shortcodes/youtube.html`
- Custom CSS for code blocks, embed containers, typography: `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/custom/head-end.html`
  (search for "embed-container", "pre code", "blockquote")

**Prereq:** Phase 1 complete.

---

## File structure after this phase

```
vitorpereira.ia.br/
├── content/
│   └── posts/
│       └── 2026/04/21/hello-world/
│           ├── index.mdx
│           └── index.en.mdx
├── features/
│   └── blog/
│       ├── lib/
│       │   ├── queries.ts
│       │   └── queries.test.ts
│       ├── mdx/
│       │   ├── MDXComponents.tsx
│       │   ├── Callout.tsx
│       │   ├── Video.tsx
│       │   ├── ImageWithBlur.tsx
│       │   └── Tweet.tsx
│       ├── components/
│       │   └── PostBody.tsx
│       └── types.ts
├── lib/
│   └── mdx/
│       └── mdx-options.ts            # remark/rehype plugins shared config
├── velite.config.ts
├── .velite/                          # generated, gitignored
└── vitest.config.ts
```

---

## Task 1: Install Velite, next-mdx-remote, and MDX plugin deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
pnpm add velite zod
pnpm add next-mdx-remote
pnpm add rehype-pretty-code shiki rehype-slug rehype-autolink-headings remark-gfm reading-time
pnpm add react-tweet
```

- [ ] **Step 2: Install dev dependencies for testing**

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/dom jsdom @types/node
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install Velite, next-mdx-remote, and Vitest for content pipeline"
```

---

## Task 2: Create shared MDX plugin options

**Files:**
- Create: `lib/mdx/mdx-options.ts`

- [ ] **Step 1: Write shared remark/rehype config**

Create `lib/mdx/mdx-options.ts`:

```ts
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypePrettyCode,
      {
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      },
    ],
    [
      rehypeAutolinkHeadings,
      {
        behavior: "append",
        properties: {
          className: ["heading-anchor"],
          ariaLabel: "Link for this section",
        },
      },
    ],
  ],
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/mdx/mdx-options.ts
git commit -m "feat: add shared MDX remark/rehype plugin options"
```

---

## Task 3: Configure Velite with post schema

**Files:**
- Create: `velite.config.ts`

- [ ] **Step 1: Write config**

Create `velite.config.ts`:

```ts
import { defineConfig, s } from "velite";
import readingTime from "reading-time";

const locales = ["pt", "en"] as const;
type Locale = (typeof locales)[number];

const postsSchema = s
  .object({
    title: s.string().max(200),
    description: s.string().max(300),
    date: s.isodate(),
    updated: s.isodate().optional(),
    draft: s.boolean().default(false),
    tags: s.array(s.string()).default([]),
    cover: s.image().optional(),
    comments: s.boolean().default(false),
    // Raw MDX body. We render via next-mdx-remote at request time,
    // so we keep the source string here instead of compiling.
    body: s.string().default(""),
    // Derived fields (filled by transform / prepare below)
    locale: s.enum(locales).default("pt"),
    slug: s.string().default(""),
    permalink: s.string().default(""),
    readingTime: s.number().default(0),
    excerpt: s.string().default(""),
    translationSlug: s.string().optional(),
  });

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    posts: {
      name: "Post",
      pattern: "posts/**/index{,.en}.mdx",
      schema: postsSchema.transform((data, { meta }) => {
        const filePath = (meta.path ?? "").replace(/\\/g, "/");
        const isEn = /\.en\.mdx$/.test(filePath);
        const locale: Locale = isEn ? "en" : "pt";

        const match = filePath.match(
          /content\/posts\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/index(?:\.en)?\.mdx$/,
        );
        if (!match) {
          throw new Error(
            `Post path does not match expected pattern: ${filePath}`,
          );
        }
        const [, year, month, day, slug] = match;
        const permalink =
          locale === "pt"
            ? `/${year}/${month}/${day}/${slug}`
            : `/en/${year}/${month}/${day}/${slug}`;

        const rawBody = (meta.content ?? "") as string;
        const rt = readingTime(rawBody);

        const stripped = rawBody
          .replace(/```[\s\S]*?```/g, "")
          .replace(/[#*_>`~\-[\]()!]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const excerpt =
          data.description && data.description.length > 0
            ? data.description
            : stripped.slice(0, 160) + (stripped.length > 160 ? "…" : "");

        return {
          ...data,
          body: rawBody,
          locale,
          slug,
          permalink,
          readingTime: Math.max(1, Math.round(rt.minutes)),
          excerpt,
        };
      }),
    },
  },
  prepare: ({ posts }) => {
    const bySlug: Record<string, { pt?: string; en?: string }> = {};
    for (const p of posts) {
      bySlug[p.slug] ??= {};
      bySlug[p.slug][p.locale as Locale] = p.permalink;
    }
    for (const p of posts) {
      const sib = bySlug[p.slug];
      p.translationSlug =
        p.locale === "pt" ? sib?.en : sib?.pt;
    }
  },
});
```

Note on `meta.content`: Velite exposes the raw body (frontmatter-stripped)
as `meta.content` inside the transform function. If the runtime version
uses a slightly different key (e.g., `meta.raw`), check
`node_modules/velite/dist/types.d.ts` and adjust.

- [ ] **Step 2: Commit**

```bash
git add velite.config.ts
git commit -m "feat: configure Velite with raw-body post schema and bilingual linking"
```

---

## Task 4: Wire Velite into Next build and Vitest

**Files:**
- Modify: `next.config.ts`, `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Update next.config.ts**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

class VelitePlugin {
  static started = false;
  apply(compiler: {
    hooks: {
      beforeCompile: { tapPromise: (name: string, cb: () => Promise<void>) => void };
    };
    options: { mode?: "development" | "production" | "none" };
  }) {
    compiler.hooks.beforeCompile.tapPromise("VelitePlugin", async () => {
      if (VelitePlugin.started) return;
      VelitePlugin.started = true;
      const { build } = await import("velite");
      await build({ watch: compiler.options.mode === "development" });
    });
  }
}

const nextConfig: NextConfig = {
  experimental: { mdxRs: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  webpack: (config) => {
    config.plugins.push(new VelitePlugin());
    return config;
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Update package.json scripts**

Set `scripts` in `package.json` to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "velite build && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create vitest.config.ts**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/content": path.resolve(__dirname, ".velite"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json vitest.config.ts
git commit -m "chore: wire Velite into Next build pipeline and Vitest"
```

---

## Task 5: Create the example hello-world post (PT + EN)

**Files:**
- Create: `content/posts/2026/04/21/hello-world/index.mdx`
- Create: `content/posts/2026/04/21/hello-world/index.en.mdx`

- [ ] **Step 1: Create PT post**

Create `content/posts/2026/04/21/hello-world/index.mdx`:

````mdx
---
title: "Olá, mundo"
description: "Primeiro post do novo blog, pra validar o pipeline MDX, syntax highlighting e componentes customizados."
date: 2026-04-21T10:00:00-03:00
draft: false
tags: [meta, blog]
comments: true
---

Este é o **primeiro post** do blog, escrito pra exercitar todo o pipeline:
MDX, Shiki, componentes React dentro do markdown, e a tradução bilíngue.

## Um heading nível 2

Parágrafo depois de um heading. O *TOC* deve capturar isso na barra lateral.

### Um heading nível 3

Com um bloco de código destacado pelo Shiki:

```ts title="exemplo.ts" showLineNumbers
function greet(name: string): string {
  return `Olá, ${name}!`;
}

console.log(greet("mundo"));
```

E um callout inline:

<Callout type="info">
  Este é um callout de exemplo. O tipo controla a cor e o ícone.
</Callout>

Um vídeo do YouTube:

<Video id="dQw4w9WgXcQ" />

Uma lista:

- Item 1
- Item 2
- Item 3

E **negrito**, *itálico*, `código inline`.
````

- [ ] **Step 2: Create EN post**

Create `content/posts/2026/04/21/hello-world/index.en.mdx`:

````mdx
---
title: "Hello, world"
description: "First post of the new blog, to validate the MDX pipeline, syntax highlighting, and custom components."
date: 2026-04-21T10:00:00-03:00
draft: false
tags: [meta, blog]
comments: true
---

This is the **first post** of the blog, written to exercise the full
pipeline: MDX, Shiki, React components inside markdown, and bilingual
translations.

## A level-2 heading

Paragraph after a heading. The *TOC* should capture this in the sidebar.

### A level-3 heading

With a code block highlighted by Shiki:

```ts title="example.ts" showLineNumbers
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("world"));
```

And an inline callout:

<Callout type="info">
  This is a sample callout. The type controls color and icon.
</Callout>

A YouTube video:

<Video id="dQw4w9WgXcQ" />

A list:

- Item 1
- Item 2
- Item 3

And **bold**, *italic*, `inline code`.
````

- [ ] **Step 3: Commit**

```bash
git add content/
git commit -m "content: add hello-world example post in PT and EN"
```

---

## Task 6: Implement Callout component

**Files:**
- Create: `features/blog/mdx/Callout.tsx`

- [ ] **Step 1: Write component**

Create `features/blog/mdx/Callout.tsx`:

```tsx
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type CalloutType = "info" | "warn" | "success" | "note";

const STYLES: Record<CalloutType, { icon: typeof Info; classes: string }> = {
  info: {
    icon: Info,
    classes: "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100",
  },
  warn: {
    icon: TriangleAlert,
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  },
  success: {
    icon: CheckCircle2,
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  },
  note: {
    icon: AlertCircle,
    classes: "border-slate-500/30 bg-slate-500/10 text-slate-950 dark:text-slate-100",
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const { icon: Icon, classes } = STYLES[type];
  return (
    <aside className={cn("my-6 flex gap-3 rounded-lg border px-4 py-3 text-sm", classes)}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/mdx/Callout.tsx
git commit -m "feat(blog): add Callout MDX component with 4 variants"
```

---

## Task 7: Implement Video component

**Files:**
- Create: `features/blog/mdx/Video.tsx`

Reference: `/Users/vop12/projects/akitaonrails.github.io/layouts/shortcodes/youtube.html`

- [ ] **Step 1: Write component**

Create `features/blog/mdx/Video.tsx`:

```tsx
export function Video({
  id,
  title = "YouTube video player",
  start,
}: {
  id: string;
  title?: string;
  start?: number;
}) {
  if (!id) throw new Error("Video component requires an `id` prop");
  const src = start
    ? `https://www.youtube.com/embed/${id}?start=${start}`
    : `https://www.youtube.com/embed/${id}`;
  return (
    <div className="my-6 aspect-video overflow-hidden rounded-lg">
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/mdx/Video.tsx
git commit -m "feat(blog): add Video (YouTube) MDX component"
```

---

## Task 8: Implement ImageWithBlur and Tweet

**Files:**
- Create: `features/blog/mdx/ImageWithBlur.tsx`, `features/blog/mdx/Tweet.tsx`

- [ ] **Step 1: Write ImageWithBlur**

Create `features/blog/mdx/ImageWithBlur.tsx`:

```tsx
import NextImage from "next/image";
import type { ComponentProps } from "react";

type ProcessedImage = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

type WithProcessed = { image: ProcessedImage; alt: string } & Omit<
  ComponentProps<typeof NextImage>,
  "src" | "width" | "height" | "alt"
>;

export function ImageWithBlur(
  props: WithProcessed | ComponentProps<typeof NextImage>,
) {
  if ("image" in props && props.image) {
    const { image, alt, ...rest } = props;
    return (
      <NextImage
        src={image.src}
        width={image.width}
        height={image.height}
        placeholder={image.blurDataURL ? "blur" : undefined}
        blurDataURL={image.blurDataURL}
        alt={alt}
        className="rounded-lg"
        {...rest}
      />
    );
  }
  return <NextImage {...(props as ComponentProps<typeof NextImage>)} />;
}
```

- [ ] **Step 2: Write Tweet**

Create `features/blog/mdx/Tweet.tsx`:

```tsx
import { Tweet as ReactTweet } from "react-tweet";

export function Tweet({ id }: { id: string }) {
  return (
    <div className="my-6 flex justify-center">
      <ReactTweet id={id} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/blog/mdx/ImageWithBlur.tsx features/blog/mdx/Tweet.tsx
git commit -m "feat(blog): add ImageWithBlur and Tweet MDX components"
```

---

## Task 9: Create MDX components registry

**Files:**
- Create: `features/blog/mdx/MDXComponents.tsx`

- [ ] **Step 1: Write registry**

Create `features/blog/mdx/MDXComponents.tsx`:

```tsx
import { Callout } from "./Callout";
import { Video } from "./Video";
import { ImageWithBlur } from "./ImageWithBlur";
import { Tweet } from "./Tweet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export const mdxComponents = {
  Callout,
  Video,
  Image: ImageWithBlur,
  Tweet,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/mdx/MDXComponents.tsx
git commit -m "feat(blog): add MDX component registry"
```

---

## Task 10: Create PostBody renderer (no runtime eval)

**Files:**
- Create: `features/blog/components/PostBody.tsx`

- [ ] **Step 1: Write renderer**

Create `features/blog/components/PostBody.tsx`:

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";
import type { Post } from "../types";

export function PostBody({ post }: { post: Post }) {
  return (
    <article className="prose-post">
      <MDXRemote
        source={post.body}
        components={mdxComponents}
        options={{ mdxOptions }}
      />
    </article>
  );
}
```

`MDXRemote` from `next-mdx-remote/rsc` compiles MDX on the server during
the React render pass (build time for static pages) and returns a fully
rendered React tree — no client-side eval, no `new Function`.

- [ ] **Step 2: Commit**

```bash
git add features/blog/components/PostBody.tsx
git commit -m "feat(blog): render MDX via next-mdx-remote/rsc (server, no eval)"
```

---

## Task 11: Create blog types

**Files:**
- Create: `features/blog/types.ts`

- [ ] **Step 1: Write types**

Create `features/blog/types.ts`:

```ts
import { posts } from "@/content";

export type Post = (typeof posts)[number];
export type Locale = Post["locale"];
```

- [ ] **Step 2: Commit**

```bash
git add features/blog/types.ts
git commit -m "feat(blog): export Post type from Velite collection"
```

---

## Task 12: Write queries (TDD) — failing tests first

**Files:**
- Create: `features/blog/lib/queries.test.ts`

- [ ] **Step 1: Write tests**

Create `features/blog/lib/queries.test.ts`:

```ts
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
      filterPublishedByLocale(all, "pt", true).map((p) => p.slug).sort(),
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
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test
```

Expected: fails — `./queries` not found.

---

## Task 13: Implement queries to pass tests

**Files:**
- Create: `features/blog/lib/queries.ts`

- [ ] **Step 1: Implement queries**

Create `features/blog/lib/queries.ts`:

```ts
import { posts as rawPosts } from "@/content";
import type { Post, Locale } from "../types";

const all = rawPosts as unknown as Post[];

export function filterPublishedByLocale(
  posts: readonly Post[],
  locale: Locale,
  includeDrafts: boolean,
): Post[] {
  return posts.filter(
    (p) => p.locale === locale && (includeDrafts || !p.draft),
  );
}

export function sortByDateDesc<T extends { date: string | Date }>(
  posts: readonly T[],
): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getAllTags(
  posts: readonly Post[],
  locale: Locale,
): string[] {
  const tags = new Set<string>();
  for (const p of posts) {
    if (p.locale !== locale || p.draft) continue;
    for (const t of p.tags ?? []) tags.add(t);
  }
  return [...tags];
}

export function getRelatedPosts(
  current: Post,
  all: readonly Post[],
  n = 3,
): Post[] {
  const pool = all.filter(
    (p) => p.slug !== current.slug && p.locale === current.locale && !p.draft,
  );
  const scored = pool.map((p) => ({
    post: p,
    score: (p.tags ?? []).filter((t) => current.tags?.includes(t)).length,
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });
  return scored.slice(0, n).map((s) => s.post);
}

// Higher-level helpers consumed by pages
export function getPostsByLocale(
  locale: Locale,
  opts: { includeDrafts?: boolean; tag?: string; limit?: number } = {},
): Post[] {
  const includeDrafts =
    opts.includeDrafts ?? process.env.NODE_ENV !== "production";
  const base = filterPublishedByLocale(all, locale, includeDrafts);
  const withTag = opts.tag
    ? base.filter((p) => p.tags?.includes(opts.tag as string))
    : base;
  const sorted = sortByDateDesc(withTag);
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}

export function getPostBySlug(
  locale: Locale,
  slug: string,
): Post | undefined {
  return all.find((p) => p.locale === locale && p.slug === slug);
}

export function getAllSlugs(locale: Locale): string[] {
  return all
    .filter((p) => p.locale === locale && !p.draft)
    .map((p) => p.slug);
}
```

- [ ] **Step 2: Build Velite so `@/content` exists**

```bash
pnpm velite build
```

Expected: `.velite/` populated with `index.*`, `posts.json`, `posts.d.ts`.

- [ ] **Step 3: Run tests — expect PASS**

```bash
pnpm test
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add features/blog/lib/
git commit -m "feat(blog): add TDD-covered queries for filter/sort/tags/related"
```

---

## Task 14: Add prose styles for MDX

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append styles**

Append to `app/globals.css`:

```css
@layer components {
  .prose-post {
    @apply font-serif text-[17px] leading-relaxed;
  }
  .prose-post h2 {
    @apply mt-12 mb-4 font-sans text-2xl font-bold tracking-tight;
  }
  .prose-post h3 {
    @apply mt-8 mb-3 font-sans text-xl font-semibold tracking-tight;
  }
  .prose-post h4 {
    @apply mt-6 mb-2 font-sans text-lg font-semibold;
  }
  .prose-post p {
    @apply my-4;
  }
  .prose-post ul {
    @apply my-4 list-disc pl-6;
  }
  .prose-post ol {
    @apply my-4 list-decimal pl-6;
  }
  .prose-post blockquote {
    @apply my-6 border-l-4 border-muted pl-4 italic text-muted-foreground;
  }
  .prose-post a {
    @apply text-primary underline underline-offset-4 hover:opacity-80;
  }
  .prose-post code:not(pre code) {
    @apply rounded bg-muted px-1.5 py-0.5 font-mono text-sm;
  }
  .prose-post pre {
    @apply my-6 overflow-x-auto rounded-lg bg-[#0d1117] p-4 text-sm;
  }
  .prose-post pre code {
    @apply grid;
  }
  .prose-post pre code span[data-line] {
    @apply px-4;
  }
  .prose-post [data-rehype-pretty-code-title] {
    @apply mb-0 rounded-t-lg bg-[#0d1117] px-4 py-2 text-xs text-muted-foreground;
  }
  .prose-post [data-rehype-pretty-code-title] + pre {
    @apply mt-0 rounded-t-none;
  }
  .prose-post .heading-anchor {
    @apply ml-2 text-muted-foreground opacity-0 transition-opacity;
  }
  .prose-post h2:hover .heading-anchor,
  .prose-post h3:hover .heading-anchor,
  .prose-post h4:hover .heading-anchor {
    @apply opacity-100;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add prose-post utility for MDX article typography"
```

---

## Task 15: End-to-end verification

- [ ] **Step 1: Verify Velite output**

```bash
pnpm velite build
ls .velite/
cat .velite/posts.json | head -30
```

Expected: collection present with our two hello-world posts and all derived
fields filled (permalink, readingTime, translationSlug, excerpt).

- [ ] **Step 2: Smoke-test rendering via throwaway route**

Create temporary `app/__debug/page.tsx`:

```tsx
import { posts } from "@/content";
import { PostBody } from "@/features/blog/components/PostBody";
import type { Post } from "@/features/blog/types";

export default function Debug() {
  const post = (posts as unknown as Post[]).find(
    (p) => p.slug === "hello-world" && p.locale === "pt",
  );
  if (!post) return <div>not found</div>;
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <PostBody post={post} />
    </div>
  );
}
```

Run:
```bash
pnpm dev
```

Visit `http://localhost:3000/__debug`. Verify:
- [ ] Title, paragraphs render correctly
- [ ] Code block is Shiki-highlighted (GitHub light theme)
- [ ] Callout renders with blue info styling
- [ ] YouTube video embeds 16:9
- [ ] Inline code, bold, italic render

Stop server, delete the debug file:

```bash
rm app/__debug/page.tsx
```

- [ ] **Step 3: Full check**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: all pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments after end-to-end content pipeline test" # skip if no changes
```

---

## Definition of Done — Phase 2

- [ ] Velite config validates frontmatter; transform derives locale, slug,
  permalink, readingTime, excerpt; prepare fills translationSlug
- [ ] Raw MDX body stored in the collection (consumed by MDXRemote)
- [ ] Example `hello-world` post exists in PT and EN
- [ ] MDX custom components: Callout, Video, ImageWithBlur, Tweet, Tabs
- [ ] `features/blog/lib/queries.ts` has 6 functions with TDD coverage for
  the 4 pure ones
- [ ] `pnpm build` produces static pages + Velite output
- [ ] `pnpm dev` watches and regenerates on content changes
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` pass
- [ ] One commit per task; Conventional Commits
