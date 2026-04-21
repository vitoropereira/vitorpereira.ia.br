# Implementation Plans — vitorpereira.ia.br Blog + Portfólio

> **For agentic workers in a fresh session:** you are going to execute these
> plans inside `/Users/vop12/projects/vitorpereira.ia.br/` (branch `main`).
> Start by reading the spec and this README end-to-end, then open the first
> plan file and follow it top to bottom.

## Reading order

1. **Spec:** `/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
   — single source of truth for all decisions. Any ambiguity in the plans,
   fall back to the spec.
2. **This README** — phase map, dependencies, references.
3. **Plan for the current phase** — one file per phase, in numeric order.

## Phase dependency graph

```
Phase 1 (Foundation)
    └─> Phase 2 (Content pipeline)
            └─> Phase 3 (Blog UI)
                    └─> Phase 5 (SEO)
                            └─> Phase 6 (Analytics/LGPD)
                                    └─> Phase 7 (Deploy)
    └─> Phase 4 (Portfolio + institutional pages)
            └─> Phase 5
```

Phase 4 can run in parallel with Phase 3 if you want (both need Phase 2).
For simplicity, execute sequentially 1 → 2 → 3 → 4 → 5 → 6 → 7.

## Phase list

| # | File | Goal | Est. tasks |
|---|---|---|---|
| 1 | `2026-04-21-phase-01-foundation.md` | Scaffold Next.js 15 + Tailwind + shadcn + next-intl + next-themes, bilingual route skeleton | 15 |
| 2 | `2026-04-21-phase-02-content-pipeline.md` | Velite + MDX + Shiki + bilingual conventions + MDX components | 15 |
| 3 | `2026-04-21-phase-03-blog-ui.md` | Blog listing, post page with TOC, tags, related posts, drafts, Giscus opt-in, command palette search | 20 |
| 4 | `2026-04-21-phase-04-portfolio-pages.md` | `projects.ts` migration from legacy, portfolio grid, home, sobre, contato, privacy, terms | 15 |
| 5 | `2026-04-21-phase-05-seo.md` | Metadata API, Schema.org, OG dynamic, RSS, sitemap, robots, canonicals, hreflang | 12 |
| 6 | `2026-04-21-phase-06-analytics-lgpd.md` | Vercel Analytics, consent banner + manage link, Clarity + GA4 gated by consent | 10 |
| 7 | `2026-04-21-phase-07-deploy.md` | Vercel deploy, env vars, Giscus real setup, domain migration, acceptance checklist | 8 |

Total: ~95 tasks.

## Reference paths

### Approved spec

- `/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`

### Akita blog (reference implementation in Hugo)

Use these to understand what to port and how the original approaches each
concern. Never copy them literally — they are Hugo/Go templates; we are
Next.js/React. Use them for design intent and structural cues.

- **Overall project:** `/Users/vop12/projects/akitaonrails.github.io/CLAUDE.md`
- **Post layout:** `/Users/vop12/projects/akitaonrails.github.io/layouts/single.html`
- **RSS:** `/Users/vop12/projects/akitaonrails.github.io/layouts/_default/list.rss.xml`
- **Schema.org:** `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/schema.html`
- **Twitter Cards:** `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/twitter_cards.html`
- **Head / custom CSS / autolang redirect:** `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/custom/head-end.html`
- **Comments (Disqus, our reference for iframe isolation):** `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/components/comments.html`
- **YouTube shortcode:** `/Users/vop12/projects/akitaonrails.github.io/layouts/shortcodes/youtube.html`
- **Index generation script:** `/Users/vop12/projects/akitaonrails.github.io/scripts/generate_index.rb`
- **Example post pair (PT + EN):** `/Users/vop12/projects/akitaonrails.github.io/content/2026/04/18/omarchy-no-thinkpad-t14-gen-6/`
  — shows real-world `index.md` + `index.en.md` structure.

### Legacy PHP portfolio (to migrate content from)

Preserved on branch `legacy-php` of the same repository
(`/Users/vop12/projects/vitorpereira.ia.br/`). To read a file without
switching branch:

```bash
cd /Users/vop12/projects/vitorpereira.ia.br
git show legacy-php:<path-from-repo-root>
```

Files that matter for migration:

- `git show legacy-php:data/projects.json` — 11 projects, source of truth for
  `features/portfolio/data/projects.ts`. Schema in spec §8.1.
- `git show legacy-php:pages/about.php` — about page content (timeline of
  professional history). Migrated to `content/pages/sobre.mdx`.
- `git show legacy-php:pages/home.php` — home hero/specialties copy.
- `git show legacy-php:pages/portfolio.php` — portfolio filtering logic
  (reference for filter UX).
- `git show legacy-php:pages/contact.php` — contact page layout reference.
- `git show legacy-php:CLAUDE.md` — full description of the old PHP stack.
- `git show legacy-php:IMPROVEMENT_PLAN.md` — original improvement plan
  (now superseded by this doc, but has project metrics and context).

## Conventions used in the plans

- **Paths** are absolute when they point outside the project root, relative
  when inside (e.g., `app/layout.tsx` means
  `/Users/vop12/projects/vitorpereira.ia.br/app/layout.tsx`).
- **Commands** assume CWD is `/Users/vop12/projects/vitorpereira.ia.br/`.
- **Package manager:** `pnpm`. If `pnpm` is unavailable install it first
  (`npm i -g pnpm` or via corepack). `npm`/`yarn` work if the engineer
  prefers — swap commands accordingly.
- **TDD:** follow it strictly for queries and library code; for pure UI
  components (listings, cards, layout) visual verification in `pnpm dev` is
  acceptable.
- **Commit cadence:** one commit per task by default. Use
  [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
  `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- **Do not bypass hooks** (`--no-verify`) unless the user explicitly says so.
- **Do not modify spec** during execution. If a decision needs revisiting,
  pause, raise it, adjust spec, then continue.

## Safety & scope reminders

- **Never modify** `/Users/vop12/projects/akitaonrails.github.io/` — that is
  a different project (the reference). Read-only.
- **Never force-push** or rewrite `main` history on this repo without
  explicit approval.
- **Legacy-php branch** is the backup of the old PHP portfolio. Leave it
  untouched.
- **Domain migration** (Phase 7, last task) is the only user-facing
  destructive change. It requires explicit user approval. Do NOT point
  DNS before that.

## Definition of done (per phase)

Each phase plan ends with a **Definition of Done** checklist. Check it
before moving to the next phase. Running `pnpm build && pnpm typecheck &&
pnpm lint && pnpm test` must pass at the end of every phase.
