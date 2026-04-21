# Phase 7 — Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL:
> superpowers:subagent-driven-development or superpowers:executing-plans.
> **This phase contains the only destructive, externally-visible action
> in the whole project — the DNS cutover. Require explicit user approval
> before executing Task 8.**

**Goal:** Deploy the site to Vercel on a provisional URL, run full
acceptance testing against the spec's 11 success criteria, set up Giscus
against the real GitHub repo, and only after user approval migrate the
`vitorpereira.ia.br` domain from the old PHP server to Vercel.

**Architecture:** Push the repo to GitHub. Create a Vercel project
connected to the repo. Set production env vars. Deploy. Validate. Migrate
DNS. Keep the old PHP server online as fallback until the new site is
proven stable.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— sections 11 (Deploy), 13 (Legacy security), 15 (Success criteria).

**Prereq:** Phases 1-6 complete and green on local `pnpm build && pnpm start`.

---

## Task 1: Push repo to GitHub

**Files:**
- None (git operations only)

- [ ] **Step 1: Verify local branch status**

```bash
cd /Users/vop12/projects/vitorpereira.ia.br
git status
git log --oneline -10
git branch -a
```

Expected: `main` clean, many commits from Phases 1-6, `legacy-php`
branch exists, remote `origin/main` is behind local.

- [ ] **Step 2: Check remote is GitHub repo**

```bash
git remote -v
```

Expected: `origin` points at something like
`git@github.com:vitoropereira/vitorpereira.ia.br.git` or the HTTPS
equivalent. If the remote is an unrelated FTP endpoint (unlikely given
the original PHP project's SFTP deploy), update it:

```bash
# ONLY IF needed — confirm with user first
# git remote set-url origin git@github.com:vitoropereira/vitorpereira.ia.br.git
```

- [ ] **Step 3: Push main and legacy-php**

```bash
git push origin main
git push origin legacy-php
```

Expected: both branches visible on GitHub.

- [ ] **Step 4: (No commit needed)**

---

## Task 2: Set up Giscus against the real repo

**Files:**
- None (Giscus configuration is on giscus.app)

- [ ] **Step 1: Enable Discussions on the GitHub repo**

In the browser, visit
`https://github.com/vitoropereira/vitorpereira.ia.br/settings` → General →
Features → enable **Discussions**.

- [ ] **Step 2: Create "Comments" category**

Visit `https://github.com/vitoropereira/vitorpereira.ia.br/discussions` →
click the gear icon next to "Categories" → **New category** →
- Name: `Comments`
- Description: `Blog post comments powered by Giscus`
- Format: **Announcement** (only maintainers can post; Giscus bypasses
  this for comments)

- [ ] **Step 3: Get configuration values**

Visit `https://giscus.app`. Enter the repo name. The page produces:
- `data-repo` (e.g., `vitoropereira/vitorpereira.ia.br`)
- `data-repo-id` (`R_kgDO...`)
- `data-category` (`Comments`)
- `data-category-id` (`DIC_kwDO...`)

Copy these four values. They are **public** identifiers and safe to
commit if needed, but we'll keep them in env vars for flexibility.

- [ ] **Step 4: Record in a local `.env.development.local`**

Create `.env.development.local` (gitignored):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GISCUS_REPO=vitoropereira/vitorpereira.ia.br
NEXT_PUBLIC_GISCUS_REPO_ID=<paste>
NEXT_PUBLIC_GISCUS_CATEGORY=Comments
NEXT_PUBLIC_GISCUS_CATEGORY_ID=<paste>
```

- [ ] **Step 5: Smoke test Giscus locally**

```bash
pnpm dev
```

Open `/2026/04/21/hello-world` (which has `comments: true`). Scroll to
bottom — Giscus widget loads. Post a test comment. Verify it appears as a
Discussion on GitHub under the "Comments" category.

Stop server.

---

## Task 3: Create Vercel project (provisional URL)

**Files:**
- None (Vercel dashboard operations)

- [ ] **Step 1: Install the Vercel CLI (optional)**

```bash
pnpm add -g vercel
```

- [ ] **Step 2: Authenticate**

```bash
vercel login
```

Follow the browser flow.

- [ ] **Step 3: Link the project (doesn't deploy yet)**

From the repo root:

```bash
vercel link
```

Prompts:
- Set up project? Yes
- Scope: your team/personal account
- Existing project? No, create new
- Name: `vitorpereira-ia-br`
- Framework preset: Next.js
- Root directory: `./`
- Want to modify settings? No

This creates `.vercel/` locally (already gitignored). At this point the
project exists on Vercel but has no deployment yet.

- [ ] **Step 4: Commit vercel-related changes (if any)**

Typically nothing tracked changes. If Vercel writes anything to
`.gitignore`, accept it.

```bash
git status
git add -A
git commit -m "chore: link Vercel project" # skip if clean
```

---

## Task 4: Configure Vercel environment variables

**Files:**
- None (Vercel dashboard or CLI)

- [ ] **Step 1: Add variables via CLI**

Using the Vercel CLI is fastest. Run each command, pasting the value when
prompted:

```bash
vercel env add NEXT_PUBLIC_SITE_URL production
# Value: https://vitorpereira.ia.br

vercel env add NEXT_PUBLIC_GA_ID production
# Value: <your GA4 measurement ID, e.g. G-XXXXXXXXXX, or leave empty if not configured yet>

vercel env add NEXT_PUBLIC_CLARITY_ID production
# Value: <your Clarity ID, or leave empty>

vercel env add NEXT_PUBLIC_GISCUS_REPO production
# Value: vitoropereira/vitorpereira.ia.br

vercel env add NEXT_PUBLIC_GISCUS_REPO_ID production
# Value: <from Task 2>

vercel env add NEXT_PUBLIC_GISCUS_CATEGORY production
# Value: Comments

vercel env add NEXT_PUBLIC_GISCUS_CATEGORY_ID production
# Value: <from Task 2>
```

- [ ] **Step 2: Add the same for preview environment**

For preview deploys (PRs), set `NEXT_PUBLIC_SITE_URL` to
`https://vitorpereira-ia-br-git-<branch>.vercel.app` pattern — simpler to
use the preview URL pattern or just leave at production value. Example:

```bash
vercel env add NEXT_PUBLIC_SITE_URL preview
# Value: https://vitorpereira-ia-br.vercel.app
```

Re-add the same variables for `preview` scope if you want preview
Giscus/GA4/Clarity working too.

- [ ] **Step 3: Verify**

```bash
vercel env ls
```

Expected: all variables listed for the correct environments.

---

## Task 5: First deploy (provisional URL)

**Files:**
- None

- [ ] **Step 1: Deploy to production URL on Vercel**

```bash
vercel --prod
```

Vercel will run `pnpm install && pnpm build` (velite build + next
build) and deploy. Expected success output with the provisional URL like
`https://vitorpereira-ia-br.vercel.app` or similar.

- [ ] **Step 2: Smoke-test the live site**

Open the provisional URL in a browser:

- [ ] `/` (PT) and `/en` load
- [ ] Theme toggle works
- [ ] Language toggle navigates between PT and EN
- [ ] `/posts` lists hello-world
- [ ] `/2026/04/21/hello-world` renders with TOC, Shiki, Callout, Video
- [ ] `/portfolio` shows 8 projects with filters
- [ ] `/sobre` renders MDX
- [ ] `/contato` shows 6 social links
- [ ] `/privacidade` and `/termos` render
- [ ] Command palette (⌘K) opens and searches
- [ ] Consent banner appears on first visit
- [ ] Accept → Clarity and GA4 load (check Network tab)
- [ ] Giscus appears on the hello-world post (if `comments: true`)

Document any failures and fix in code. For each fix:

```bash
git add -A
git commit -m "fix: <specific issue>"
git push  # Vercel auto-deploys
```

---

## Task 6: Run acceptance checklist against spec

**Files:**
- None (verification)

The spec's §15 has 11 success criteria. Check each:

- [ ] **(1)** Site builds and deploys on Vercel without errors
- [ ] **(2)** Home, listing of posts, post individual, sobre, portfolio,
  contact, privacy, terms all work in PT and EN
- [ ] **(3)** Language toggle works; disables with tooltip when
  translation missing
- [ ] **(4)** At least 1 example post renders correctly in both languages
  with TOC, syntax highlighting, Giscus (since `comments: true`), related
  posts
- [ ] **(5)** Dark mode works (persistence, transition)
- [ ] **(6)** RSS, sitemap, robots, Schema.org, OG, Twitter Cards validate:
  - Paste an EN post URL into https://search.google.com/test/rich-results
    — expect BlogPosting recognized
  - Paste a post URL into https://cards-dev.twitter.com/validator — expect
    summary_large_image preview
  - Paste `https://<provisional-url>/rss.xml` into https://validator.w3.org/feed/
    — expect valid RSS 2.0
- [ ] **(7)** Consent banner appears first visit; Clarity and GA4 only
  load after accepting; Vercel Analytics always on
- [ ] **(8)** Command palette ⌘K opens and finds posts
- [ ] **(9)** Drafts visible in dev, invisible in prod (verify on
  provisional URL — hello-world visible, draft-only-example-post NOT
  visible)
- [ ] **(10)** Lighthouse Performance ≥90, SEO ≥95, Accessibility ≥90 on
  `/` and `/2026/04/21/hello-world` in incognito mode, mobile preset
- [ ] **(11)** Domain migration (Task 8) — pending until user approval

Document pass/fail for each. If any fail, fix and redeploy before Task 8.

---

## Task 7: Security reminders — pre-domain migration

- [ ] **Step 1: Change the old FTP password**

The file `.vscode/sftp.json` was committed on the `legacy-php` branch and
is therefore in the git history. That file contained production FTP
credentials for the old PHP server.

**Action required from user (can't be automated):**
- Log into the old hosting provider's control panel
- Change the FTP password for the account used in `sftp.json`
- Confirm with the agent when done

This should happen BEFORE the DNS migration to avoid any overlap window
where the old server is still reachable with compromised creds while the
new one comes online.

- [ ] **Step 2: Optionally rewrite git history**

If you want to fully scrub the credentials from the git history on
GitHub, run (after coordinating with anyone who has a clone):

```bash
# DESTRUCTIVE — user approval required before running
git filter-repo --path .vscode/sftp.json --invert-paths
git push --force origin legacy-php main
```

Only do this if the user explicitly asks. For most cases, rotating the
password is sufficient because the creds become useless.

---

## Task 8: DNS migration (requires explicit user approval)

**REQUIRES EXPLICIT USER APPROVAL.** Do not execute Steps 3-5 without the
user saying "approved" or equivalent.

- [ ] **Step 1: Add the custom domain to the Vercel project**

In Vercel Dashboard → vitorpereira-ia-br → Settings → Domains →
Add Domain → `vitorpereira.ia.br`. Vercel shows the required DNS records
(A record or CNAME to `cname.vercel-dns.com`).

- [ ] **Step 2: Ask user for explicit approval**

Before changing DNS, stop and confirm:

> "Everything passed acceptance. Ready to cut DNS over from the old PHP
> server to Vercel. This is the point of no easy return — rolling back
> means DNS propagation again (up to 48h). Do you approve?"

Wait for a clear "yes" / "approved" response.

- [ ] **Step 3: Update DNS records at the domain registrar**

In the registrar's DNS panel, for `vitorpereira.ia.br`:

- Remove the A record pointing to the old PHP hosting IP
- Add an A record to `76.76.21.21` (Vercel's default apex IP) **OR** an
  ANAME/ALIAS record to `cname.vercel-dns.com` (if the registrar
  supports it — some do, some don't)
- For `www.vitorpereira.ia.br`, CNAME to `cname.vercel-dns.com`

Vercel provides the exact values in the domain settings page — follow
those.

- [ ] **Step 4: Wait for propagation and Vercel verification**

Vercel Dashboard → Domains shows "Valid Configuration" once DNS
propagates and the TLS certificate is issued. Allow up to a couple of
hours.

- [ ] **Step 5: Verify**

- [ ] `https://vitorpereira.ia.br` serves the new Next.js site
- [ ] `https://www.vitorpereira.ia.br` redirects to the apex
- [ ] TLS certificate valid (lock icon in browser)
- [ ] Spot-check every URL from Task 6 on the real domain

---

## Task 9: Post-migration validation

- [ ] **Step 1: Re-run SEO validators on the real domain**

Now that the site is publicly reachable at the real domain:

- [ ] Google Rich Results Test on a post URL — BlogPosting recognized
- [ ] Twitter Card Validator on a post URL — summary_large_image preview
- [ ] W3C Feed Validator on `https://vitorpereira.ia.br/rss.xml` — valid
- [ ] Lighthouse Mobile scores on real domain (Performance, SEO,
  Accessibility, Best Practices) all ≥90

- [ ] **Step 2: Configure Google Search Console**

Submit the site and sitemap:

- Go to https://search.google.com/search-console
- Add property for `https://vitorpereira.ia.br`
- Verify ownership (recommended: DNS TXT record method)
- Submit sitemap: `https://vitorpereira.ia.br/sitemap.xml`

- [ ] **Step 3: (Optional) Cloudflare or DNS monitoring**

Set up a simple uptime monitor (UptimeRobot, HealthChecks.io free tier)
pinging `https://vitorpereira.ia.br/` every 5 minutes to alert if the
site goes down.

---

## Task 10: Celebrate and document

- [ ] **Step 1: Update README.md**

Replace the empty or default README with a project-level README:

Create `README.md`:

```markdown
# vitorpereira.ia.br

Personal blog and portfolio of Vitor Pereira, built with Next.js 15.

- **PT:** https://vitorpereira.ia.br
- **EN:** https://vitorpereira.ia.br/en

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- Velite + next-mdx-remote (MDX content pipeline)
- next-intl (bilingual PT default, EN at `/en`)
- next-themes (dark mode)
- Shiki + rehype-pretty-code (syntax highlighting)
- Giscus (comments, opt-in per post)
- Vercel Analytics + Microsoft Clarity + Google Analytics 4 (with LGPD consent)
- Deployed on Vercel

## Content

Posts live at `content/posts/YYYY/MM/DD/slug/index.mdx` (PT) +
`index.en.mdx` (EN). Pages at `content/pages/*.mdx`.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — Velite + Next production build
- `pnpm test` — Vitest
- `pnpm typecheck` — strict TS check
- `pnpm lint` — ESLint
- `pnpm format` — Prettier

## Docs

- Spec: `docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
- Plans: `docs/superpowers/plans/`
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add project README"
git push
```

- [ ] **Step 3: Final check**

The project is live. The PHP legacy stays accessible via the
`legacy-php` branch for future reference.

---

## Definition of Done — Phase 7 / Whole project

- [ ] Repository on GitHub with `main` and `legacy-php` branches
- [ ] Vercel project linked, env vars set for production (and preview)
- [ ] Deployment live on provisional Vercel URL and passing all 11
  spec success criteria
- [ ] Giscus working against real GitHub Discussions
- [ ] Old FTP password rotated
- [ ] Domain `vitorpereira.ia.br` cut over to Vercel (with user
  approval)
- [ ] SEO validators (Google, Twitter, W3C) pass
- [ ] Google Search Console property verified and sitemap submitted
- [ ] Lighthouse scores ≥90 on production
- [ ] README.md committed
- [ ] User explicitly confirms the project is shipped
