# vitorpereira.ia.br

Personal blog and portfolio of Vitor Pereira, built with Next.js 16.

- **PT:** https://vitorpereira.ia.br
- **EN:** https://vitorpereira.ia.br/en

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript strict
- React 19
- Tailwind CSS v4 (CSS-first tokens) + shadcn/ui on `@base-ui/react`
- Velite + next-mdx-remote (MDX content pipeline)
- next-intl (bilingual: PT default at `/`, EN at `/en`)
- next-themes (dark mode with system preference)
- Shiki + rehype-pretty-code (syntax highlighting)
- Giscus (comments, opt-in per post)
- Vercel Analytics + Speed Insights (always on) + Microsoft Clarity + Google Analytics 4 (gated by LGPD consent)
- Deployed on Vercel

## Content

- Posts: `content/posts/YYYY/MM/DD/slug/index.mdx` (PT) and `index.en.mdx` (EN, optional)
- Pages: `content/pages/*.mdx`
- Portfolio data: `features/portfolio/data/projects.ts`

## Scripts

- `pnpm dev` — Velite watch + Next dev server on http://localhost:3003
- `pnpm build` — `velite build && next build`
- `pnpm start` — Next production server
- `pnpm test` — Vitest (unit)
- `pnpm typecheck` — strict TypeScript check
- `pnpm lint` — ESLint (`next/core-web-vitals`)
- `pnpm format` / `pnpm format:check` — Prettier

## Environment variables

See `.env.example`. All public (`NEXT_PUBLIC_*`) because they are consumed on the client and safe to expose.

## Docs

- Spec: `docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
- Plans: `docs/superpowers/plans/`
