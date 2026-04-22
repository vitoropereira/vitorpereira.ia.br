# US-001: Migrar `middleware.ts` → `proxy.ts` (Next 16)

> **PRD**: `docs/prd/02_tech-debt-pos-ship.md`
> **Task**: `docs/tasks/02/US-001_middleware-to-proxy.md`
> **Status**: Pendente

## Description

Como engenheiro do projeto, quero substituir `middleware.ts` pela nova API `proxy.ts` introduzida no Next 16, para eliminar o deprecation warning e alinhar o código com a direção oficial do framework.

## Acceptance Criteria

- [ ] **Pre-flight**: WebFetch em https://nextjs.org/docs/app/api-reference/file-conventions/proxy (ou equivalente) para confirmar:
  - Nome exato do arquivo (`proxy.ts` no root)
  - Nome do export default (`proxy` vs `middleware` — Next 16 pode aceitar os dois ou só um)
  - Se `config.matcher` mudou de shape
  - Se `NextResponse.next()` continua válido
- [ ] Renomear `middleware.ts` → `proxy.ts` no root do repo (NÃO mover para `app/`)
- [ ] Renomear o export default conforme o que Next 16 espera (provavelmente `export function proxy(...)`)
- [ ] Lógica interna preservada byte-a-byte — apenas renomes:
  - Bypass `/_next`, `/api`, `/static`, arquivos com extensão (PUBLIC_FILE regex)
  - Detecção `hasLocalePrefix` por segmento (`pathname === '/pt'` ou startsWith `/pt/`, idem `/en`)
  - Cookie `NEXT_LOCALE` + fallback `Accept-Language` → `/en` ou stay default PT
  - Header `x-pathname` injetado na response (usado por next-intl `getRequestConfig`)
- [ ] `config.matcher` preservado: `["/((?!_next|api|.*\\..*).*)"]`
- [ ] `pnpm build` roda **sem warnings de deprecation** relacionados a middleware/proxy
- [ ] `pnpm dev` sobe sem warnings
- [ ] Smoke test manual (incognito, `pnpm dev` em http://localhost:3003):
  - [ ] Browser `Accept-Language: en-US,en;q=0.9` + cookie limpo → abrir `/` redireciona para `/en`
  - [ ] Browser `Accept-Language: pt-BR,pt;q=0.9` + cookie limpo → `/` fica em `/` e renderiza PT
  - [ ] Cookie `NEXT_LOCALE=en` manual (DevTools) + abrir `/` → redireciona para `/en`
  - [ ] `/posts` com cookie PT → continua em `/posts`
  - [ ] `/en/posts` com qualquer combo → continua em `/en/posts`
  - [ ] `/_next/static/...`, `/api/..` (se existir), `/sitemap.xml`, `/rss.xml`, `/favicon.ico` passam sem tocar (não redirecionam)
- [ ] next-intl `getRequestConfig` continua lendo `x-pathname` corretamente:
  - Home PT renderiza com locale `pt`
  - Home EN renderiza com locale `en`
  - Post bilíngue renderiza em cada locale correto
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` passam
- [ ] Build Vercel pós-merge continua funcionando (smoke em preview branch antes de merge em main)

## Implementation Notes

### Arquivos afetados

- `middleware.ts` → **deletado**
- `proxy.ts` → **novo** (root, mesmo conteúdo lógico, renomeado export + arquivo)
- `next.config.ts` → checar só se o WebFetch acima revelar que Next 16 exige declaração explícita (provavelmente não)

### Código atual (referência) — middleware.ts

```typescript
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

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

### Mudança mínima esperada

Diff conceitual:

```diff
- // middleware.ts
- export function middleware(request: NextRequest) {
+ // proxy.ts
+ export function proxy(request: NextRequest) {
    // ... mesma lógica
  }

  export const config = {
    matcher: ["/((?!_next|api|.*\\..*).*)"],
  };
```

Se Next 16 ainda aceita `middleware` como nome do export em `proxy.ts`, manter o nome `middleware` é opção — mas mais limpo renomear junto para não gerar confusão.

### ⚠️ Risco conhecido

next-intl `getRequestConfig` em `i18n/request.ts` consome `headers().get('x-pathname')` server-side. Se `proxy` tiver timing diferente de `middleware` (ex: roda após rendering em vez de antes), o header pode não estar disponível ainda e `getLocale()` retornaria o default fallback. Mitigação:

1. Confirmar no docs do Next 16 que proxy roda ANTES do rendering (semântica esperada)
2. Se não: mover detecção de locale para `layout.tsx` via `params` do segmento `[locale]` ou ler cookie direto

### Dependências

- Depends on: PRD 01 status `Concluído` (não quebrar site no ar)
- Blocks: nenhuma (US de tech-debt isolada)

## Testing

- [ ] Manual smoke local (lista acima)
- [ ] Preview branch na Vercel para validar que o build prod também não quebra
- [ ] Se possível, deploy em preview URL e re-rodar Lighthouse — garantir que Performance não regrediu
