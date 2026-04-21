# Phase 6 — Analytics + LGPD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL:
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Add three analytics layers with proper LGPD consent. Vercel
Analytics (always on, no cookies). Microsoft Clarity and Google
Analytics 4 loaded only after explicit user consent via a footer banner
with Accept/Reject buttons and a "Manage cookies" link always present.

**Architecture:** A consent cookie (`consent`, 1 year) controls whether
Clarity and GA4 inject their scripts. The banner is a client component
listening to a DOM custom event (`consent:reopen`) from the footer link.
When the user clicks Accept or Reject, the cookie is written and the
banner hides. Scripts check the cookie on mount and render `<Script>`
nodes only when `consent === "accepted"`.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— section 10 (Analytics and LGPD).

**Prereq:** Phases 1-5 complete.

---

## Task 1: Install Vercel Analytics

**Files:**

- Modify: `package.json`, `app/layout.tsx`

- [ ] **Step 1: Install**

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 2: Wire into root layout**

Modify `app/layout.tsx` — inside `<body>`, after the ThemeProvider, add
the analytics components:

```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
...
<ThemeProvider ...>
  {children}
  <Analytics />
  <SpeedInsights />
</ThemeProvider>
```

(Or outside the provider — doesn't matter functionally.)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml app/layout.tsx
git commit -m "feat(analytics): add Vercel Analytics and Speed Insights (no consent needed)"
```

---

## Task 2: Consent cookie helper

**Files:**

- Create: `lib/consent.ts`

- [ ] **Step 1: Write helper**

Create `lib/consent.ts`:

```ts
export type ConsentValue = "accepted" | "rejected";

const COOKIE_NAME = "consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=(accepted|rejected)`),
  );
  return (match?.[1] as ConsentValue) ?? null;
}

export function writeConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/consent.ts
git commit -m "feat(consent): add cookie helpers for LGPD consent"
```

---

## Task 3: ConsentBanner component

**Files:**

- Create: `components/analytics/ConsentBanner.tsx`

- [ ] **Step 1: Write**

Create `components/analytics/ConsentBanner.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { readConsent, writeConsent } from "@/lib/consent";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export function ConsentBanner() {
  const locale = useLocale() as "pt" | "en";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
    const handler = () => setVisible(true);
    window.addEventListener("consent:reopen", handler);
    return () => window.removeEventListener("consent:reopen", handler);
  }, []);

  if (!visible) return null;

  const accept = () => {
    writeConsent("accepted");
    setVisible(false);
    // Force reload so scripts pick up the new state on this page view
    window.location.reload();
  };
  const reject = () => {
    writeConsent("rejected");
    setVisible(false);
  };

  const copy = {
    pt: {
      title: "Cookies",
      body: "Usamos cookies para entender como o site é usado e melhorar sua experiência. Você pode aceitar ou recusar.",
      accept: "Aceitar",
      reject: "Recusar",
      privacy: "Política de privacidade",
    },
    en: {
      title: "Cookies",
      body: "We use cookies to understand how the site is used and to improve your experience. You can accept or reject.",
      accept: "Accept",
      reject: "Reject",
      privacy: "Privacy policy",
    },
  }[locale];

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={copy.title}
      className="bg-background fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground text-sm">
          {copy.body}{" "}
          <Link
            href={institutionalRoutes.privacy[locale]}
            className="hover:text-foreground underline"
          >
            {copy.privacy}
          </Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            {copy.reject}
          </Button>
          <Button size="sm" onClick={accept}>
            {copy.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/ConsentBanner.tsx
git commit -m "feat(consent): add LGPD consent banner with Accept/Reject and reopen event"
```

---

## Task 4: ClarityScript component

**Files:**

- Create: `components/analytics/ClarityScript.tsx`

- [ ] **Step 1: Write**

Create `components/analytics/ClarityScript.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent } from "@/lib/consent";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function ClarityScript() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "accepted");
  }, []);

  if (!CLARITY_ID || !allowed) return null;

  const src = `https://www.clarity.ms/tag/${CLARITY_ID}`;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="${src}";
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script");`}
    </Script>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/ClarityScript.tsx
git commit -m "feat(analytics): add Clarity script gated by consent cookie"
```

---

## Task 5: GAScript component

**Files:**

- Create: `components/analytics/GAScript.tsx`

- [ ] **Step 1: Write**

Create `components/analytics/GAScript.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GAScript() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "accepted");
  }, []);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/GAScript.tsx
git commit -m "feat(analytics): add Google Analytics 4 script gated by consent cookie"
```

---

## Task 6: Wire analytics and banner into root layout

**Files:**

- Modify: `app/layout.tsx`

- [ ] **Step 1: Add imports and mount**

Replace the existing `app/layout.tsx` body with:

```tsx
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import { GAScript } from "@/components/analytics/GAScript";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
```

Inside `<body>`, after `ThemeProvider`:

```tsx
<ThemeProvider ...>
  {children}
  <ConsentBanner />
  <ClarityScript />
  <GAScript />
  <Analytics />
  <SpeedInsights />
</ThemeProvider>
```

Note: `<ConsentBanner>` needs to be inside `NextIntlClientProvider` for
`useLocale` to work. Move it from root layout into the `(site)` layouts
(both PT and EN). Analytics and SpeedInsights stay in root layout.

- [ ] **Step 2: Update (site) layouts**

In `app/(site)/layout.tsx`, add inside the `<div className="flex min-h-screen flex-col">`, after `<Footer />`:

```tsx
<ConsentBanner />
<ClarityScript />
<GAScript />
```

Similarly in `app/(site)/en/layout.tsx`, after the content block, add the
same three components.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(analytics): wire consent banner + Clarity + GA4 into site layouts"
```

---

## Task 7: Verify footer "Manage cookies" button dispatches event

The footer was updated in Phase 4 to dispatch
`new CustomEvent("consent:reopen")` when the button is clicked. The
ConsentBanner from Task 3 listens for this event.

- [ ] **Step 1: Manual check**

```bash
pnpm dev
```

- Visit `/` on first load → banner appears
- Click Accept → banner disappears, page reloads
- Click "Gerenciar cookies" in footer → banner reappears
- Click Reject → banner disappears
- Clear cookies (`document.cookie = 'consent=; max-age=0'`) → refresh →
  banner appears again

Stop server.

- [ ] **Step 2: Commit fixes (if any)**

```bash
git add -A
git commit -m "fix: consent banner reopen flow" # skip if clean
```

---

## Task 8: Ensure privacy page is linked from banner

The banner already links to `/privacidade` and `/en/privacy` via
`institutionalRoutes.privacy[locale]`. No change needed if Phase 4 was
followed.

- [ ] **Step 1: Verify the link opens the privacy page**

Click the link in the banner → should navigate to privacy page.

---

## Task 9: Full build and production smoke

- [ ] **Step 1: Build**

```bash
pnpm build
pnpm start
```

- [ ] **Step 2: Production smoke**

Open DevTools → Network tab. Reload `/`.

- [ ] Before accepting consent:
  - [ ] `clarity.ms` requests **not** present
  - [ ] `googletagmanager.com/gtag/js` requests **not** present
  - [ ] `/_vercel/insights/*` requests **are** present (Vercel Analytics)

- [ ] After clicking Accept and page reloads:
  - [ ] `clarity.ms/tag/<ID>` loads
  - [ ] `googletagmanager.com/gtag/js?id=<GA_ID>` loads

- [ ] After clicking Reject on a fresh session (clear cookies):
  - [ ] Neither Clarity nor GA4 loads
  - [ ] Banner stays hidden on subsequent visits

Stop server.

- [ ] **Step 3: Full checks**

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Expected: all pass.

- [ ] **Step 4: Commit any adjustments**

```bash
git add -A
git commit -m "fix: analytics production smoke adjustments" # skip if clean
```

---

## Task 10: Document local testing of analytics env vars

- [ ] **Step 1: Add a dev note to `.env.example`**

Append to `.env.example` (or inline if already present):

```
# --- Phase 6 notes ---
# Leave blank in local dev if you don't have accounts yet.
# With empty values, the Clarity and GA4 scripts simply do not load
# (consent banner still appears and functions).
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: clarify analytics env var behavior in .env.example"
```

---

## Definition of Done — Phase 6

- [ ] Vercel Analytics + Speed Insights load always (no consent needed)
- [ ] Consent banner appears on first visit in PT or EN
- [ ] Accept/Reject buttons work, cookie is persisted for 1 year
- [ ] "Gerenciar cookies" / "Manage cookies" link in footer re-opens
      banner
- [ ] Clarity script loads only after Accept AND env var is set
- [ ] GA4 script loads only after Accept AND env var is set
- [ ] Reject path keeps analytics off but allows normal site use
- [ ] Privacy policy link in banner navigates to the correct locale
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` pass
