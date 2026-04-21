# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js 15 App Router project with Tailwind v4,
shadcn/ui, next-intl (bilingual routing), next-themes (dark mode), and a
bilingual skeleton (PT default, EN at `/en`). At the end, `pnpm dev` serves
an empty but navigable site in both languages with working theme and
language toggles.

**Architecture:** App Router with a `(site)` route group that wraps PT
pages and contains a nested `en/` folder for EN routes. Physical routes
(not `[locale]` dynamic) to allow PT with no prefix. next-intl handles
locale detection, cookie persistence, and translation messages. shadcn/ui
provides composable primitives; components live in `components/ui/`.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Tailwind CSS v4,
shadcn/ui, next-intl 3.x, next-themes, pnpm, ESLint, Prettier.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— spec sections 3 (stack), 4 (folder structure), 6 (rotas, i18n, layouts).

**Akita references for inspiration:**
- Language toggle: `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/custom/lang-toggle.html`
- Header and auto-redirect: `/Users/vop12/projects/akitaonrails.github.io/layouts/partials/custom/head-end.html`

---

## File structure after this phase

```
vitorpereira.ia.br/
├── app/
│   ├── layout.tsx                    # root layout, fonts, providers
│   └── (site)/
│       ├── layout.tsx                # header/footer wrapper
│       ├── page.tsx                  # PT home (placeholder)
│       └── en/
│           ├── layout.tsx            # EN locale provider wrapper
│           └── page.tsx              # EN home (placeholder)
├── components/
│   ├── ui/                           # shadcn primitives (Button, etc.)
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── LangToggle.tsx
│       ├── ThemeToggle.tsx
│       └── SocialLinks.tsx
├── lib/
│   ├── i18n/
│   │   ├── config.ts                 # locales, default, routing
│   │   ├── messages/
│   │   │   ├── pt.json
│   │   │   └── en.json
│   │   └── routeMap.ts               # /sobre ↔ /en/about etc.
│   ├── siteConfig.ts                 # name, URL, social, etc.
│   └── utils.ts                      # cn() helper
├── public/
├── middleware.ts                     # next-intl locale detection
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Verify prerequisites and scaffold Next.js

**Files:**
- Create: entire `vitorpereira.ia.br/` scaffold via `create-next-app`

- [ ] **Step 1: Verify Node and pnpm are installed**

Run:
```bash
node --version
pnpm --version || npm i -g pnpm
```

Expected: Node ≥20.x, pnpm ≥9.x. If pnpm missing, install it globally.

- [ ] **Step 2: Verify cwd is clean and on main**

Run:
```bash
cd /Users/vop12/projects/vitorpereira.ia.br
git status
git branch --show-current
ls -la
```

Expected: branch `main`, working tree clean (the clear-main commit from
pre-phase is the latest), only `.claude/`, `.clauderc`, `.env.example`,
`.git/`, `.gitignore`, `docs/` present.

- [ ] **Step 3: Scaffold Next.js app INTO the current directory**

`create-next-app` refuses to write into a non-empty dir by default. We use
a temp scratch dir and move files in, so the `.git/` history is preserved.

Run:
```bash
cd /Users/vop12/projects/vitorpereira.ia.br
pnpm create next-app@latest ./.scaffold \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --use-pnpm \
  --no-turbopack --yes
```

Expected: folder `.scaffold/` created with a full Next.js app.

- [ ] **Step 4: Merge scaffold into project root**

Run:
```bash
cd /Users/vop12/projects/vitorpereira.ia.br
# Move everything, including dotfiles, avoiding clobber of .git / .claude
shopt -s dotglob
for f in .scaffold/*; do
  base="$(basename "$f")"
  if [ "$base" = ".git" ] || [ "$base" = "node_modules" ]; then
    continue
  fi
  if [ -e "$base" ]; then
    # Don't clobber .gitignore (we'll merge it), .env.example (keep ours)
    if [ "$base" = ".gitignore" ] || [ "$base" = ".env.example" ]; then
      mv "$f" "${base}.scaffold"
    else
      rm -rf "$base"
      mv "$f" ./
    fi
  else
    mv "$f" ./
  fi
done
shopt -u dotglob
rm -rf .scaffold
ls -la
```

Expected: standard Next.js files present (`package.json`, `app/`,
`next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, etc.). `.git/`,
`.claude/`, `.clauderc`, `docs/` preserved.

- [ ] **Step 5: Merge .gitignore and remove scaffold copies**

Manual merge — open both files and add any missing lines from
`.gitignore.scaffold` to `.gitignore`. Typical additions: `/node_modules`,
`/.next`, `/out/`, `/build`, `.DS_Store`, `.env*.local`, `/.pnpm-store/`,
`next-env.d.ts`. Also ensure we add `.velite/` and `.scaffold/`.

Run:
```bash
# After manual merge, remove scaffold leftovers:
rm -f .gitignore.scaffold .env.example.scaffold
cat .gitignore
```

Expected: a single `.gitignore` with Next.js defaults plus `.velite/`.

- [ ] **Step 6: Verify pnpm install and dev server**

Run:
```bash
pnpm install
pnpm dev
```

Expected: server on http://localhost:3000, shows Next.js welcome page.
Stop with Ctrl+C.

- [ ] **Step 7: Commit scaffold**

Run:
```bash
git add -A
git status
git commit -m "chore: scaffold Next.js 15 App Router with Tailwind and TypeScript"
```

---

## Task 2: Harden tsconfig and add path aliases

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Enable strict mode and extra aliases**

Replace `compilerOptions` in `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/features/*": ["./features/*"],
      "@/lib/*": ["./lib/*"],
      "@/content": ["./.velite"],
      "@/content/*": ["./.velite/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".velite/**/*.d.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Verify typecheck passes**

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: enable TS strict and add path aliases for features/lib/content"
```

---

## Task 3: Install and configure shadcn/ui

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`
- Create: `components.json`, `components/ui/button.tsx` (+ others),
  `lib/utils.ts`

- [ ] **Step 1: Initialize shadcn**

Run:
```bash
pnpm dlx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Accept defaults otherwise. This creates `components.json`, writes
`lib/utils.ts` with `cn()`, and updates `tailwind.config.ts` and
`app/globals.css` with CSS variables for light/dark themes.

- [ ] **Step 2: Install initial shadcn primitives we will need**

Run:
```bash
pnpm dlx shadcn@latest add button dropdown-menu sheet toggle tabs dialog command
```

Expected: creates files under `components/ui/`. Each command installs its
Radix dependency via pnpm.

- [ ] **Step 3: Verify typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components.json components/ui/ lib/utils.ts tailwind.config.ts app/globals.css package.json pnpm-lock.yaml
git commit -m "chore: install shadcn/ui with initial primitives"
```

---

## Task 4: Install next-themes and wire ThemeProvider

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/ThemeProvider.tsx`

- [ ] **Step 1: Install next-themes**

Run:
```bash
pnpm add next-themes
```

- [ ] **Step 2: Create ThemeProvider wrapper**

Create `components/layout/ThemeProvider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 3: Wrap root layout**

Replace `app/layout.tsx` body with:

```tsx
import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update tailwind.config.ts to include font variables**

In `tailwind.config.ts`, inside `theme.extend`, add:

```ts
fontFamily: {
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  serif: ["var(--font-serif)", "Georgia", "serif"],
},
```

- [ ] **Step 5: Run dev to verify no hydration warnings**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Open DevTools console — should have no React
hydration warnings. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml app/layout.tsx tailwind.config.ts components/layout/ThemeProvider.tsx
git commit -m "feat: add next-themes with ThemeProvider and bilingual fonts"
```

---

## Task 5: Install and configure next-intl

**Files:**
- Create: `lib/i18n/config.ts`, `lib/i18n/routing.ts`,
  `lib/i18n/messages/pt.json`, `lib/i18n/messages/en.json`, `middleware.ts`,
  `i18n/request.ts`
- Modify: `next.config.ts`, `app/layout.tsx`

- [ ] **Step 1: Install next-intl**

Run:
```bash
pnpm add next-intl
```

- [ ] **Step 2: Create i18n configuration**

Create `lib/i18n/config.ts`:

```ts
export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";
```

Create `lib/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});
```

- [ ] **Step 3: Create translation messages (stubs)**

Create `lib/i18n/messages/pt.json`:

```json
{
  "nav": {
    "home": "Início",
    "posts": "Blog",
    "portfolio": "Portfólio",
    "about": "Sobre",
    "contact": "Contato"
  },
  "blog": {
    "readingTime": "{minutes} min de leitura",
    "relatedPosts": "Posts relacionados",
    "tags": "Tags",
    "draft": "RASCUNHO"
  },
  "footer": {
    "copyright": "© {year} Vitor Pereira",
    "manageCookies": "Gerenciar cookies"
  },
  "langToggle": {
    "switchToEnglish": "Versão em inglês",
    "switchToPortuguese": "Versão em português",
    "translationMissing": "Tradução não disponível"
  },
  "theme": {
    "toggle": "Alternar tema",
    "light": "Claro",
    "dark": "Escuro",
    "system": "Sistema"
  }
}
```

Create `lib/i18n/messages/en.json`:

```json
{
  "nav": {
    "home": "Home",
    "posts": "Blog",
    "portfolio": "Portfolio",
    "about": "About",
    "contact": "Contact"
  },
  "blog": {
    "readingTime": "{minutes} min read",
    "relatedPosts": "Related posts",
    "tags": "Tags",
    "draft": "DRAFT"
  },
  "footer": {
    "copyright": "© {year} Vitor Pereira",
    "manageCookies": "Manage cookies"
  },
  "langToggle": {
    "switchToEnglish": "English version",
    "switchToPortuguese": "Portuguese version",
    "translationMissing": "Translation not available"
  },
  "theme": {
    "toggle": "Toggle theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

- [ ] **Step 4: Create next-intl request config**

Create `i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;
  const pathname = headerStore.get("x-pathname") ?? "";

  const pathLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
  const locale: Locale =
    pathLocale ?? (cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale);

  return {
    locale,
    messages: (await import(`@/lib/i18n/messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Create middleware**

Create `middleware.ts` (at repo root):

```ts
import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocalePrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (!hasLocalePrefix && pathname === "/") {
    // First visit — detect from Accept-Language if no cookie set
    if (cookieLocale === "en") {
      return NextResponse.redirect(new URL("/en", request.url), 307);
    }
    if (!cookieLocale) {
      const accept = request.headers.get("accept-language") ?? "";
      const prefersEn = /^en\b/i.test(accept) || /[,;]\s*en\b/i.test(accept);
      if (prefersEn && !accept.toLowerCase().startsWith("pt")) {
        const res = NextResponse.redirect(new URL("/en", request.url), 307);
        res.cookies.set("NEXT_LOCALE", "en", {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
        return res;
      }
      const res = NextResponse.next();
      res.cookies.set("NEXT_LOCALE", defaultLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }
  }

  // Attach pathname for getRequestConfig (next-intl helper)
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

- [ ] **Step 6: Wire next-intl plugin into next.config.ts**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Verify typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml lib/i18n/ i18n/ middleware.ts next.config.ts
git commit -m "feat: configure next-intl with PT default and EN prefix routing"
```

---

## Task 6: Create siteConfig and routeMap

**Files:**
- Create: `lib/siteConfig.ts`, `lib/i18n/routeMap.ts`

- [ ] **Step 1: Create siteConfig**

Create `lib/siteConfig.ts`:

```ts
import type { Locale } from "./i18n/config";

export const siteConfig = {
  name: "Vitor Pereira",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitorpereira.ia.br",
  tagline: {
    pt: "Dev full-stack com 10+ anos de experiência construindo SaaS, automação e produtos com IA.",
    en: "Full-stack dev with 10+ years building SaaS, automation, and AI products.",
  },
  author: {
    name: "Vitor Onofre Pereira",
    url: "https://vitorpereira.ia.br/sobre",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/vitor-onofre-pereira/",
    github: "https://github.com/vitoropereira",
    instagram: "https://www.instagram.com/vitorpereirasaas/",
    x: "https://x.com/VITORONOFRE",
    youtube: "https://www.youtube.com/@vitoropereira",
    tabnews: "https://www.tabnews.com.br/vitorpereirasaas",
  },
  twitterHandle: "@VITORONOFRE",
  featuredCategories: [] as string[],
  defaultLocale: "pt" as Locale,
  locales: ["pt", "en"] as const satisfies readonly Locale[],
  postsPerPage: 20,
} as const;

export type SiteConfig = typeof siteConfig;
```

- [ ] **Step 2: Create routeMap**

Create `lib/i18n/routeMap.ts`:

```ts
export const institutionalRoutes: Record<
  string,
  { pt: string; en: string }
> = {
  home: { pt: "/", en: "/en" },
  about: { pt: "/sobre", en: "/en/about" },
  portfolio: { pt: "/portfolio", en: "/en/portfolio" },
  contact: { pt: "/contato", en: "/en/contact" },
  privacy: { pt: "/privacidade", en: "/en/privacy" },
  terms: { pt: "/termos", en: "/en/terms" },
  postsList: { pt: "/posts", en: "/en/posts" },
};

export function swapLocale(path: string, target: "pt" | "en"): string {
  for (const entry of Object.values(institutionalRoutes)) {
    if (entry.pt === path) return entry.en;
    if (entry.en === path) return entry.pt;
  }
  // Posts share slug between locales: /YYYY/MM/DD/slug  <->  /en/YYYY/MM/DD/slug
  if (target === "en" && !path.startsWith("/en")) return `/en${path}`;
  if (target === "pt" && path.startsWith("/en/")) return path.replace(/^\/en/, "");
  if (target === "pt" && path === "/en") return "/";
  return path;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/siteConfig.ts lib/i18n/routeMap.ts
git commit -m "feat: add siteConfig source-of-truth and bilingual route map"
```

---

## Task 7: Create `(site)` route group layout

**Files:**
- Create: `app/(site)/layout.tsx`
- Modify: `app/layout.tsx` (remove page-specific stuff, already done in Task 4)

- [ ] **Step 1: Create site layout**

Create `app/(site)/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale="pt">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Delete existing `app/page.tsx` (Next.js boilerplate)**

Run:
```bash
rm app/page.tsx
```

- [ ] **Step 3: Create PT home placeholder**

Create `app/(site)/page.tsx`:

```tsx
import { siteConfig } from "@/lib/siteConfig";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-6 text-xl text-muted-foreground">
        {siteConfig.tagline.pt}
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        Site em construção — blog técnico + portfólio.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ components/layout/
git commit -m "feat: add (site) layout group and PT home placeholder"
```

Note: components referenced (`Header`, `Footer`) are created in Task 9. TS
will error until then — ignore briefly or inline placeholders.

---

## Task 8: Create EN route with locale provider

**Files:**
- Create: `app/(site)/en/layout.tsx`, `app/(site)/en/page.tsx`

- [ ] **Step 1: Create EN layout**

Create `app/(site)/en/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Create EN home placeholder**

Create `app/(site)/en/page.tsx`:

```tsx
import { siteConfig } from "@/lib/siteConfig";

export default function HomePageEn() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-6 text-xl text-muted-foreground">
        {siteConfig.tagline.en}
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        Site under construction — technical blog + portfolio.
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(site\)/en/
git commit -m "feat: add EN route layout and home placeholder"
```

---

## Task 9: Create Header, Footer, LangToggle, ThemeToggle, SocialLinks

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`,
  `components/layout/LangToggle.tsx`,
  `components/layout/ThemeToggle.tsx`,
  `components/layout/SocialLinks.tsx`

- [ ] **Step 1: Install lucide-react (icons)**

Run:
```bash
pnpm add lucide-react
```

- [ ] **Step 2: Create ThemeToggle**

Create `components/layout/ThemeToggle.tsx`:

```tsx
"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const t = useTranslations("theme");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("toggle")}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" /> {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Create LangToggle**

Create `components/layout/LangToggle.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { swapLocale } from "@/lib/i18n/routeMap";

export function LangToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("langToggle");

  const target = locale === "pt" ? "en" : "pt";
  const href = swapLocale(pathname, target);
  const label =
    target === "en" ? t("switchToEnglish") : t("switchToPortuguese");

  const flag = target === "en" ? "EN" : "PT";

  return (
    <Button asChild variant="ghost" size="sm" aria-label={label}>
      <Link
        href={href}
        onClick={() => {
          document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=${60 * 60 * 24 * 365}`;
        }}
      >
        {flag}
      </Link>
    </Button>
  );
}
```

- [ ] **Step 4: Create SocialLinks**

Create `components/layout/SocialLinks.tsx`:

```tsx
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-current"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TabNewsIcon = () => (
  <span className="text-xs font-bold tracking-tight">TN</span>
);

export function SocialLinks({ variant = "footer" }: { variant?: "footer" | "inline" }) {
  const items = [
    { href: siteConfig.social.linkedin, icon: Linkedin, label: "LinkedIn" },
    { href: siteConfig.social.github, icon: Github, label: "GitHub" },
    {
      href: siteConfig.social.instagram,
      icon: Instagram,
      label: "Instagram",
    },
    { href: siteConfig.social.x, icon: XIcon, label: "X (Twitter)" },
    { href: siteConfig.social.youtube, icon: Youtube, label: "YouTube" },
    {
      href: siteConfig.social.tabnews,
      icon: TabNewsIcon,
      label: "TabNews",
    },
  ];

  return (
    <ul
      className={
        variant === "footer"
          ? "flex items-center gap-4 text-muted-foreground"
          : "flex items-center gap-3"
      }
    >
      {items.map(({ href, icon: Icon, label }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="transition-colors hover:text-foreground"
          >
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Create Header**

Create `components/layout/Header.tsx`:

```tsx
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale as "pt" | "en"];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href={r("home")} className="font-serif text-lg font-bold">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href={r("postsList")} className="hover:text-foreground text-muted-foreground">
            {t("posts")}
          </Link>
          <Link href={r("portfolio")} className="hover:text-foreground text-muted-foreground">
            {t("portfolio")}
          </Link>
          <Link href={r("about")} className="hover:text-foreground text-muted-foreground">
            {t("about")}
          </Link>
          <Link href={r("contact")} className="hover:text-foreground text-muted-foreground">
            {t("contact")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Create Footer**

Create `components/layout/Footer.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { SocialLinks } from "./SocialLinks";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row">
        <span>{t("copyright", { year })}</span>
        <SocialLinks />
      </div>
    </footer>
  );
}
```

- [ ] **Step 7: Install any missing shadcn primitives**

If dropdown-menu isn't present yet, run:
```bash
pnpm dlx shadcn@latest add dropdown-menu
```

- [ ] **Step 8: Verify dev server shows both pages with working toggles**

```bash
pnpm dev
```

Visit:
- `http://localhost:3000/` — shows PT home with "Site em construção — blog técnico + portfólio."
- `http://localhost:3000/en` — shows EN home with "Site under construction — technical blog + portfolio."
- Click PT/EN toggle — navigates between them.
- Click theme toggle — cycles light/dark/system.

Stop with Ctrl+C.

- [ ] **Step 9: Typecheck and lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml components/layout/
git commit -m "feat: add header, footer, language toggle, theme toggle, and social links"
```

---

## Task 10: Ensure .gitignore, .env.example, and .prettierrc are correct

**Files:**
- Modify: `.gitignore`, `.env.example`
- Create: `.prettierrc`

- [ ] **Step 1: Ensure .gitignore covers Velite output and local files**

Ensure `.gitignore` contains at least these lines (add any missing):

```
/node_modules
/.next/
/out/
/build
next-env.d.ts
.DS_Store
.env*.local
.env
.vscode/
.idea/
/coverage/
/.velite/
.pnpm-store/
```

- [ ] **Step 2: Rewrite .env.example for the new stack**

Replace `.env.example` with:

```
# Site URL (used for canonical URLs, OG, absolute links)
NEXT_PUBLIC_SITE_URL=https://vitorpereira.ia.br

# --- Analytics (Phase 6) ---
# Google Analytics 4 measurement ID (format: G-XXXXXXXXXX)
NEXT_PUBLIC_GA_ID=

# Microsoft Clarity project ID (format: 10-char alphanumeric)
NEXT_PUBLIC_CLARITY_ID=

# --- Comments (Phase 3/7) ---
# Giscus — see https://giscus.app for values
NEXT_PUBLIC_GISCUS_REPO=
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
```

- [ ] **Step 3: Create .prettierrc**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 4: Install prettier plugin**

Run:
```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

- [ ] **Step 5: Add scripts to package.json**

Modify `package.json` `scripts` to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 6: Run format and commit**

```bash
pnpm format
pnpm typecheck
pnpm lint
```

Expected: all pass.

```bash
git add -A
git commit -m "chore: configure Prettier, env template, and package scripts"
```

---

## Task 11: Verify bilingual site end-to-end

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Manual acceptance checks**

Open in browser:

- [ ] `/` loads PT home
- [ ] Click nav "Blog", "Portfólio", "Sobre", "Contato" — 404 is acceptable
  for now (routes added in later phases)
- [ ] Theme toggle in header cycles through Light → Dark → System, with
  colors updating live
- [ ] Language toggle shows "EN" when on PT; clicking navigates to `/en`
- [ ] Once on `/en`, language toggle shows "PT"; clicking navigates to `/`
- [ ] Language preference persists across reloads (cookie set)
- [ ] Refresh with `localStorage.clear()` and no cookie — arriving at `/`,
  if browser language is English, you get redirected to `/en`
- [ ] Console has no hydration warnings

Document any issues. Stop server.

- [ ] **Step 3: Build check**

```bash
pnpm build
```

Expected: builds successfully. The build outputs static pages for both `/`
and `/en`.

- [ ] **Step 4: Commit if any tweaks**

If fixes were needed to pass the acceptance checks, commit them:

```bash
git add -A
git commit -m "fix: <describe what you fixed>"
```

---

## Definition of Done — Phase 1

- [ ] `pnpm dev` starts with no errors and serves `/` (PT) and `/en` (EN)
- [ ] Theme toggle works (light/dark/system)
- [ ] Language toggle navigates between `/` and `/en` and sets
  `NEXT_LOCALE` cookie
- [ ] Browser language detection on first visit redirects to `/en` when
  `Accept-Language` starts with `en`
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` succeeds
- [ ] `pnpm lint` succeeds
- [ ] `pnpm format:check` succeeds
- [ ] Git history: one commit per task (11+ commits), Conventional Commits
- [ ] No hydration warnings in DevTools console
