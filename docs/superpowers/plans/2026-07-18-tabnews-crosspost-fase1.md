# TabNews Cross-post (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um comando local (`pnpm crosspost <post>`) que transforma um post PT publicado em markdown de resumo e o publica no TabNews com `source_url` canônica, marcando o post pra não duplicar.

**Architecture:** Biblioteca em camadas — transform MDX→markdown (função pura), cliente HTTP tipado do TabNews (com `fetch` injetável), e um comando fino que orquestra. Sem banco nesta fase. Leitura do post via `gray-matter` no próprio `.mdx`; marcador gravado por edição cirúrgica do frontmatter.

**Tech Stack:** TypeScript (Node 24 roda `.ts` nativo), Vitest, `fetch` global do Node, `gray-matter` (nova **devDependency**).

## Global Constraints

- Gerenciador: **pnpm** (nunca npm). Testes: **Vitest** (`*.test.ts` ao lado do código). Rodar um arquivo: `pnpm exec vitest run <arquivo>`.
- **Imports relativos COM extensão `.ts` explícita** em toda a lib de syndication, nos testes dela e no script — o runner de TS do Node **não** resolve o alias `@/` nem imports extensionless (verificado: só `./x.ts` resolve; `./x` e `./x.js` falham). Pacotes de `node_modules` (`gray-matter`, `node:*`) importam sem extensão. Componentes do Next (Task 7) seguem o padrão do repo (extensionless).
- **Pré-requisito tsconfig:** ligar `"allowImportingTsExtensions": true` (Task 2, Step 0) pro `tsc --noEmit` aceitar imports `.ts`. Compatível com o `noEmit: true` existente; extensionless continua válido.
- **Nome é Vitor** (não Victor) em qualquer texto/commit.
- Base canônica é **sempre produção**: `https://vitorpereira.ia.br` — constante fixa, **nunca** de `NEXT_PUBLIC_SITE_URL` (localhost em dev).
- API TabNews: host `https://www.tabnews.com.br`, base `/api/v1`. Login por `Cookie: session_id=<token>` (não Bearer). Criar exige **`status: "published"`** explícito (default é `draft`). `body` ≤ **20.000** chars. `source_url` fica **limpo** (sem UTM); UTM só no link do CTA.
- Só posts **PT** (arquivo `index.mdx`, não `index.en.mdx`) e **publicados** (`draft === false`).
- **Fluxo dry-run→editar→publicar:** `--dry-run` grava `.syndication/<slug>.preview.md`; o run real **usa esse arquivo editado se existir**, senão gera na hora.
- Segredos (`TABNEWS_EMAIL`/`TABNEWS_PASSWORD`) só locais, **nunca** `NEXT_PUBLIC`, nunca commitados.
- Deferido (NÃO implementar agora): Supabase, log de clique, `--update`/PATCH, cache de sessão, rota HTTP, marcador de corte no MDX.

## File Structure

- `lib/syndication/config.ts` — constantes (base canônica, host TabNews, limite).
- `lib/mdx/transforms.ts` — transforms inline puros (Callout, Video, links internos).
- `lib/mdx/to-tabnews-markdown.ts` — body por formato (summary/teaser/full) + CTA/UTM + guard 20k.
- `lib/tabnews/errors.ts` — erros tipados.
- `lib/tabnews/client.ts` — `createSession`, `createContent` (fetch injetável).
- `lib/syndication/types.ts` — `SourcePost`, `TabNewsContent`, `SyndicationResult`.
- `lib/syndication/publish-tabnews.ts` — `buildTabNewsPreview` (puro) + `publishToTabNews` (rede).
- `lib/mdx/frontmatter.ts` — ler campo / gravar marcador `tabnews:` (fs puro, testável).
- `lib/mdx/load-post.ts` — `loadPostFromPath` via `gray-matter`.
- `scripts/crosspost.ts` — CLI.
- `velite.config.ts`, `features/blog/components/PostMeta.tsx` — campo + link (modify).
- `tsconfig.json`, `.env.example`, `.gitignore`, `package.json` — flag, slots, ignore, script + devDep.

---

### Task 1: Transforms inline (Callout, Video, links internos)

**Files:**
- Create: `lib/mdx/transforms.ts`
- Test: `lib/mdx/transforms.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `calloutsToBlockquotes(md: string): string`
  - `videosToLinks(md: string): string`
  - `absolutizeInternalLinks(md: string, base: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// lib/mdx/transforms.test.ts
import { describe, it, expect } from "vitest";
import { calloutsToBlockquotes, videosToLinks, absolutizeInternalLinks } from "./transforms.ts";

describe("calloutsToBlockquotes", () => {
  it("converte Callout note em citação com rótulo", () => {
    expect(calloutsToBlockquotes(`<Callout type="note">\n  Texto do aviso.\n</Callout>`)).toBe("> **Nota:** Texto do aviso.");
  });
  it("mapeia warn e info", () => {
    expect(calloutsToBlockquotes(`<Callout type="warn">Cuidado.</Callout>`)).toBe("> **Atenção:** Cuidado.");
    expect(calloutsToBlockquotes(`<Callout type="info">Fyi.</Callout>`)).toBe("> **Info:** Fyi.");
  });
});

describe("videosToLinks", () => {
  it("troca <Video id> por link do YouTube", () => {
    expect(videosToLinks(`<Video id="abc123" />`)).toBe("[Assista no YouTube](https://youtu.be/abc123)");
  });
});

describe("absolutizeInternalLinks", () => {
  it("prefixa links internos", () => {
    const src = "veja o [texto anterior](/2026/05/31/chatbot-nao-e-agente) aqui";
    expect(absolutizeInternalLinks(src, "https://vitorpereira.ia.br")).toBe(
      "veja o [texto anterior](https://vitorpereira.ia.br/2026/05/31/chatbot-nao-e-agente) aqui",
    );
  });
  it("não toca em externos", () => {
    expect(absolutizeInternalLinks("[x](https://exemplo.com)", "https://vitorpereira.ia.br")).toBe("[x](https://exemplo.com)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/mdx/transforms.test.ts`
Expected: FAIL (módulo `./transforms.ts` não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/mdx/transforms.ts
const CALLOUT_LABEL: Record<string, string> = { note: "Nota", warn: "Atenção", info: "Info" };

/** `<Callout type="x">...</Callout>` → `> **Label:** ...` (uma linha). */
export function calloutsToBlockquotes(md: string): string {
  return md.replace(
    /<Callout\s+type=["'](note|warn|info)["']\s*>([\s\S]*?)<\/Callout>/g,
    (_m, type: string, inner: string) => `> **${CALLOUT_LABEL[type] ?? "Nota"}:** ${inner.replace(/\s+/g, " ").trim()}`,
  );
}

/** `<Video id="X" />` → link do YouTube. */
export function videosToLinks(md: string): string {
  return md.replace(
    /<Video\s+id=["']([^"']+)["'][^>]*\/?>(?:<\/Video>)?/g,
    (_m, id: string) => `[Assista no YouTube](https://youtu.be/${id})`,
  );
}

/** Links markdown que começam com `/` viram absolutos. */
export function absolutizeInternalLinks(md: string, base: string): string {
  return md.replace(/\]\((\/[^)]*)\)/g, (_m, path: string) => `](${base}${path})`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/mdx/transforms.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/mdx/transforms.ts lib/mdx/transforms.test.ts
git commit -m "feat(syndication): transforms inline MDX (callout, video, links internos)"
```

---

### Task 2: Markdown por formato + CTA/UTM (+ tsconfig)

**Files:**
- Modify: `tsconfig.json` (`allowImportingTsExtensions`)
- Create: `lib/syndication/config.ts`
- Create: `lib/mdx/to-tabnews-markdown.ts`
- Test: `lib/mdx/to-tabnews-markdown.test.ts`

**Interfaces:**
- Consumes: transforms de `./transforms.ts` (Task 1).
- Produces:
  - `config.ts`: `SITE_URL`, `MAX_BODY`, `TABNEWS_API`, `TABNEWS_WEB`.
  - `type SyndicationFormat = "summary" | "teaser" | "full"`
  - `toTabNewsMarkdown(input: { body: string; title: string; canonicalUrl: string; format: SyndicationFormat }): string` — lança `Error` acima de `MAX_BODY`.

- [ ] **Step 0: Ligar allowImportingTsExtensions**

Em `tsconfig.json`, dentro de `compilerOptions`, após `"isolatedModules": true,`:

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 1: Write the failing test**

```ts
// lib/mdx/to-tabnews-markdown.test.ts
import { describe, it, expect } from "vitest";
import { toTabNewsMarkdown } from "./to-tabnews-markdown.ts";

const BODY = `Intro em [um link](/2026/05/31/ancora) que fisga.

Segundo parágrafo da lede.

## 1. Objetivo — o que precisa estar concluído?

Objetivo é condição de término verificável. Segue mais texto.

## 2. Contexto — o que ele sabe?

O erro comum é excesso, não falta. Mais uma frase.`;

const base = { title: "As 7 perguntas", canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/arquitetura" };

describe("toTabNewsMarkdown", () => {
  it("summary: linha por seção + CTA com UTM", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "summary" });
    expect(out).toContain("- **1. Objetivo — o que precisa estar concluído?** — Objetivo é condição de término verificável.");
    expect(out).toContain("- **2. Contexto — o que ele sabe?** — O erro comum é excesso, não falta.");
    expect(out).toContain("utm_content=summary");
    expect(out).toContain("[As 7 perguntas](https://vitorpereira.ia.br/2026/07/18/arquitetura?");
  });
  it("teaser: lede (até 1º ##) com link absoluto + CTA", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "teaser" });
    expect(out).toContain("[um link](https://vitorpereira.ia.br/2026/05/31/ancora)");
    expect(out).toContain("Segundo parágrafo da lede.");
    expect(out).not.toContain("## 1. Objetivo");
    expect(out).toContain("utm_content=teaser");
  });
  it("full: corpo inteiro + rodapé de origem", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "full" });
    expect(out).toContain("## 1. Objetivo");
    expect(out).toContain("Publicado originalmente");
    expect(out).toContain("utm_content=full");
  });
  it("estoura acima de 20k chars", () => {
    expect(() => toTabNewsMarkdown({ ...base, body: "x".repeat(20001), format: "full" })).toThrow(/20/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/mdx/to-tabnews-markdown.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/syndication/config.ts
export const SITE_URL = "https://vitorpereira.ia.br";
export const MAX_BODY = 20000;
export const TABNEWS_API = "https://www.tabnews.com.br/api/v1";
export const TABNEWS_WEB = "https://www.tabnews.com.br";
```

```ts
// lib/mdx/to-tabnews-markdown.ts
import { calloutsToBlockquotes, videosToLinks, absolutizeInternalLinks } from "./transforms.ts";
import { SITE_URL, MAX_BODY } from "../syndication/config.ts";

export type SyndicationFormat = "summary" | "teaser" | "full";

function transformInline(md: string): string {
  return absolutizeInternalLinks(videosToLinks(calloutsToBlockquotes(md)), SITE_URL);
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const m = clean.match(/^(.*?[.!?])(\s|$)/);
  return (m ? m[1] : clean).trim();
}

function extractSummary(body: string): string {
  const lines = body.split("\n");
  const items: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.+)$/);
    if (!h) continue;
    const rest: string[] = [];
    for (let j = i + 1; j < lines.length && !/^##\s+/.test(lines[j]); j++) rest.push(lines[j]);
    const para = rest.join("\n").trim().split(/\n\s*\n/)[0] ?? "";
    items.push(`- **${h[1].trim()}** — ${firstSentence(para)}`);
  }
  return items.join("\n");
}

function extractTeaser(body: string): string {
  const idx = body.search(/^##\s+/m);
  return (idx === -1 ? body : body.slice(0, idx)).trim();
}

function cta(title: string, canonicalUrl: string, format: SyndicationFormat): string {
  const url = `${canonicalUrl}?utm_source=tabnews&utm_medium=syndication&utm_content=${format}`;
  return `\n\n---\n\nEscrevi o resto no meu site:\n\n**[${title}](${url})**`;
}

export function toTabNewsMarkdown(input: {
  body: string;
  title: string;
  canonicalUrl: string;
  format: SyndicationFormat;
}): string {
  const { body, title, canonicalUrl, format } = input;
  let out: string;
  if (format === "summary") {
    out = extractSummary(transformInline(body)) + cta(title, canonicalUrl, format);
  } else if (format === "teaser") {
    out = extractTeaser(transformInline(body)) + cta(title, canonicalUrl, format);
  } else {
    const url = `${canonicalUrl}?utm_source=tabnews&utm_medium=syndication&utm_content=full`;
    out = `${transformInline(body)}\n\n---\n\nPublicado originalmente em ${url}`;
  }
  if (out.length > MAX_BODY) throw new Error(`Body de ${out.length} chars excede o limite de 20.000 do TabNews.`);
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/mdx/to-tabnews-markdown.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json lib/syndication/config.ts lib/mdx/to-tabnews-markdown.ts lib/mdx/to-tabnews-markdown.test.ts
git commit -m "feat(syndication): markdown do TabNews por formato + CTA/UTM + guard 20k"
```

---

### Task 3: Cliente TabNews (createSession, createContent)

**Files:**
- Create: `lib/tabnews/errors.ts`
- Create: `lib/tabnews/client.ts`
- Test: `lib/tabnews/client.test.ts`

**Interfaces:**
- Consumes: `TABNEWS_API`, `TABNEWS_WEB` de `../syndication/config.ts` (Task 2).
- Produces:
  - `class TabNewsError`, `class RateLimitError`, `class AuthError`.
  - `interface TabNewsSession { token: string; expiresAt: string }`
  - `createSession(creds: { email: string; password: string }, deps?: { fetch?: typeof fetch }): Promise<TabNewsSession>`
  - `interface CreateContentInput { title: string; body: string; status: "published" | "draft"; sourceUrl: string }`
  - `interface CreatedContent { url: string; ownerUsername: string; slug: string }`
  - `createContent(session: TabNewsSession, input: CreateContentInput, deps?: { fetch?: typeof fetch }): Promise<CreatedContent>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/tabnews/client.test.ts
import { describe, it, expect, vi } from "vitest";
import { createSession, createContent, RateLimitError, AuthError } from "./client.ts";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("createSession", () => {
  it("manda email/senha e devolve token", async () => {
    const fetch = vi.fn().mockResolvedValue(json(201, { token: "t".repeat(96), expires_at: "2026-08-17T00:00:00Z" }));
    const s = await createSession({ email: "a@b.com", password: "secret123" }, { fetch });
    expect(s.token).toHaveLength(96);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "a@b.com", password: "secret123" });
  });
  it("403 vira AuthError", async () => {
    const fetch = vi.fn().mockResolvedValue(json(403, { message: "não ativada" }));
    await expect(createSession({ email: "a@b.com", password: "secret123" }, { fetch })).rejects.toBeInstanceOf(AuthError);
  });
});

describe("createContent", () => {
  const session = { token: "t".repeat(96), expiresAt: "z" };
  it("envia status published + Cookie; monta a URL pública", async () => {
    const fetch = vi.fn().mockResolvedValue(json(201, { owner_username: "vitorpereirasaas", slug: "meu-post" }));
    const r = await createContent(session, { title: "T", body: "B", status: "published", sourceUrl: "https://vitorpereira.ia.br/x" }, { fetch });
    expect(r.url).toBe("https://www.tabnews.com.br/vitorpereirasaas/meu-post");
    expect(fetch.mock.calls[0][1].headers.Cookie).toBe(`session_id=${session.token}`);
    expect(JSON.parse(fetch.mock.calls[0][1].body).status).toBe("published");
  });
  it("429 vira RateLimitError", async () => {
    const fetch = vi.fn().mockResolvedValue(json(429, { message: "muitas requisições" }));
    await expect(createContent(session, { title: "T", body: "B", status: "published", sourceUrl: "https://x" }, { fetch })).rejects.toBeInstanceOf(RateLimitError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/tabnews/client.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/tabnews/errors.ts
export class TabNewsError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "TabNewsError";
  }
}
export class RateLimitError extends TabNewsError {
  constructor(message: string) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
export class AuthError extends TabNewsError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = "AuthError";
  }
}
```

```ts
// lib/tabnews/client.ts
import { TABNEWS_API, TABNEWS_WEB } from "../syndication/config.ts";
import { TabNewsError, RateLimitError, AuthError } from "./errors.ts";

export { TabNewsError, RateLimitError, AuthError };

export interface TabNewsSession { token: string; expiresAt: string }
export interface CreateContentInput { title: string; body: string; status: "published" | "draft"; sourceUrl: string }
export interface CreatedContent { url: string; ownerUsername: string; slug: string }

type Deps = { fetch?: typeof fetch };

async function readError(res: Response): Promise<string> {
  try {
    return ((await res.json()) as { message?: string }).message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
function raise(status: number, message: string): never {
  if (status === 429) throw new RateLimitError(message);
  if (status === 401 || status === 403) throw new AuthError(message, status);
  throw new TabNewsError(message, status);
}

export async function createSession(creds: { email: string; password: string }, deps: Deps = {}): Promise<TabNewsSession> {
  const f = deps.fetch ?? fetch;
  const res = await f(`${TABNEWS_API}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) raise(res.status, await readError(res));
  const j = (await res.json()) as { token: string; expires_at: string };
  return { token: j.token, expiresAt: j.expires_at };
}

export async function createContent(session: TabNewsSession, input: CreateContentInput, deps: Deps = {}): Promise<CreatedContent> {
  const f = deps.fetch ?? fetch;
  const res = await f(`${TABNEWS_API}/contents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `session_id=${session.token}` },
    body: JSON.stringify({ title: input.title, body: input.body, status: input.status, source_url: input.sourceUrl }),
  });
  if (!res.ok) raise(res.status, await readError(res));
  const j = (await res.json()) as { owner_username: string; slug: string };
  return { url: `${TABNEWS_WEB}/${j.owner_username}/${j.slug}`, ownerUsername: j.owner_username, slug: j.slug };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/tabnews/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tabnews/errors.ts lib/tabnews/client.ts lib/tabnews/client.test.ts
git commit -m "feat(syndication): cliente TabNews (createSession, createContent) com erros tipados"
```

---

### Task 4: Tipos + build/publish (separando puro de rede)

**Files:**
- Create: `lib/syndication/types.ts`
- Create: `lib/syndication/publish-tabnews.ts`
- Test: `lib/syndication/publish-tabnews.test.ts`

**Interfaces:**
- Consumes: `toTabNewsMarkdown`, `SyndicationFormat` (Task 2); `createSession`, `createContent` (Task 3).
- Produces:
  - `interface SourcePost { title: string; body: string; canonicalUrl: string; permalink: string; locale: "pt" | "en"; draft: boolean; tags: string[] }`
  - `interface TabNewsContent { title: string; body: string; sourceUrl: string; status: "published" | "draft" }`
  - `interface SyndicationResult { target: "tabnews"; url: string; externalSlug: string; format: SyndicationFormat }`
  - `buildTabNewsPreview(post: SourcePost, format: SyndicationFormat, status: "published" | "draft"): TabNewsContent` (puro)
  - `publishToTabNews(content: TabNewsContent, format: SyndicationFormat, creds: { email: string; password: string }, deps?): Promise<SyndicationResult>`

- [ ] **Step 1: Write the failing test**

```ts
// lib/syndication/publish-tabnews.test.ts
import { describe, it, expect, vi } from "vitest";
import { buildTabNewsPreview, publishToTabNews } from "./publish-tabnews.ts";
import type { SourcePost } from "./types.ts";

const post: SourcePost = {
  title: "As 7 perguntas",
  body: "Lede.\n\n## 1. Objetivo — x\n\nCondição verificável. Mais.",
  canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/arquitetura",
  permalink: "/2026/07/18/arquitetura",
  locale: "pt",
  draft: false,
  tags: ["agentes"],
};

describe("buildTabNewsPreview", () => {
  it("monta title/body/sourceUrl sem rede", () => {
    const c = buildTabNewsPreview(post, "summary", "published");
    expect(c.title).toBe("As 7 perguntas");
    expect(c.sourceUrl).toBe(post.canonicalUrl);
    expect(c.status).toBe("published");
    expect(c.body).toContain("- **1. Objetivo — x** — Condição verificável.");
  });
});

describe("publishToTabNews", () => {
  it("faz login, publica o body dado e devolve a URL", async () => {
    const createSession = vi.fn().mockResolvedValue({ token: "t".repeat(96), expiresAt: "z" });
    const createContent = vi.fn().mockResolvedValue({ url: "https://www.tabnews.com.br/vitor/as-7", ownerUsername: "vitor", slug: "as-7" });
    const content = { title: "T", body: "corpo editado", sourceUrl: post.canonicalUrl, status: "published" as const };
    const r = await publishToTabNews(content, "summary", { email: "a@b.com", password: "secret123" }, { createSession, createContent });
    expect(r.url).toBe("https://www.tabnews.com.br/vitor/as-7");
    expect(createContent.mock.calls[0][1]).toMatchObject({ body: "corpo editado", sourceUrl: post.canonicalUrl, status: "published" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/syndication/publish-tabnews.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/syndication/types.ts
import type { SyndicationFormat } from "../mdx/to-tabnews-markdown.ts";

export interface SourcePost {
  title: string;
  body: string;
  canonicalUrl: string;
  permalink: string;
  locale: "pt" | "en";
  draft: boolean;
  tags: string[];
}
export interface TabNewsContent {
  title: string;
  body: string;
  sourceUrl: string;
  status: "published" | "draft";
}
export interface SyndicationResult {
  target: "tabnews";
  url: string;
  externalSlug: string;
  format: SyndicationFormat;
}
```

```ts
// lib/syndication/publish-tabnews.ts
import { toTabNewsMarkdown, type SyndicationFormat } from "../mdx/to-tabnews-markdown.ts";
import {
  createSession as defaultCreateSession,
  createContent as defaultCreateContent,
} from "../tabnews/client.ts";
import type { SourcePost, TabNewsContent, SyndicationResult } from "./types.ts";

/** Puro: transforma o post no conteúdo a enviar. Não chama rede. */
export function buildTabNewsPreview(
  post: SourcePost,
  format: SyndicationFormat,
  status: "published" | "draft",
): TabNewsContent {
  const body = toTabNewsMarkdown({ body: post.body, title: post.title, canonicalUrl: post.canonicalUrl, format });
  return { title: post.title, body, sourceUrl: post.canonicalUrl, status };
}

type Deps = { createSession?: typeof defaultCreateSession; createContent?: typeof defaultCreateContent };

/** Rede: recebe o conteúdo FINAL (já possivelmente editado à mão) e publica. */
export async function publishToTabNews(
  content: TabNewsContent,
  format: SyndicationFormat,
  creds: { email: string; password: string },
  deps: Deps = {},
): Promise<SyndicationResult> {
  const createSession = deps.createSession ?? defaultCreateSession;
  const createContent = deps.createContent ?? defaultCreateContent;
  const session = await createSession(creds);
  const created = await createContent(session, content);
  return { target: "tabnews", url: created.url, externalSlug: created.slug, format };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/syndication/publish-tabnews.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/syndication/types.ts lib/syndication/publish-tabnews.ts lib/syndication/publish-tabnews.test.ts
git commit -m "feat(syndication): buildTabNewsPreview (puro) + publishToTabNews (body final)"
```

---

### Task 5: Frontmatter (marcador) + carregar post do `.mdx`

**Files:**
- Create: `lib/mdx/frontmatter.ts`
- Create: `lib/mdx/load-post.ts`
- Test: `lib/mdx/frontmatter.test.ts`
- Test: `lib/mdx/load-post.test.ts`
- Modify: `package.json` (devDependency `gray-matter`)

**Interfaces:**
- Consumes: `SITE_URL` (Task 2); `SourcePost` (Task 4).
- Produces:
  - `readFrontmatterField(mdxPath: string, field: string): string | undefined`
  - `writeSyndicationMarker(mdxPath: string, url: string): void`
  - `permalinkFromPath(mdxPath: string): string` (exportada, pura — deriva permalink do caminho)
  - `loadPostFromPath(mdxPath: string): SourcePost` (via `gray-matter`; lança se caminho não for PT `index.mdx`)

- [ ] **Step 1: Install gray-matter**

Run: `pnpm add -D gray-matter`
Expected: `gray-matter` em `devDependencies`.

- [ ] **Step 2: Write the failing test**

```ts
// lib/mdx/frontmatter.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { writeSyndicationMarker, readFrontmatterField } from "./frontmatter.ts";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let file: string;
beforeEach(() => {
  file = join(mkdtempSync(join(tmpdir(), "post-")), "index.mdx");
  writeFileSync(file, `---\ntitle: "T"\ndraft: false\ntags: [agentes]\n---\n\nCorpo.\n`);
});

describe("frontmatter", () => {
  it("grava e lê o campo tabnews", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/x");
    expect(readFrontmatterField(file, "tabnews")).toBe("https://www.tabnews.com.br/vitor/x");
  });
  it("preserva os campos existentes", () => {
    writeSyndicationMarker(file, "https://www.tabnews.com.br/vitor/x");
    expect(readFrontmatterField(file, "title")).toBe("T");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run lib/mdx/frontmatter.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 4: Write minimal implementation**

```ts
// lib/mdx/frontmatter.ts
import { readFileSync, writeFileSync } from "node:fs";

/** Lê um campo string simples do frontmatter (aspas opcionais). */
export function readFrontmatterField(mdxPath: string, field: string): string | undefined {
  const fm = readFileSync(mdxPath, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return undefined;
  const line = fm[1].split("\n").find((l) => l.startsWith(`${field}:`));
  return line?.slice(field.length + 1).trim().replace(/^["']|["']$/g, "");
}

/** Insere `tabnews: "<url>"` antes do `---` de fechamento, preservando o resto. */
export function writeSyndicationMarker(mdxPath: string, url: string): void {
  const src = readFileSync(mdxPath, "utf8");
  const m = src.match(/^(---\n[\s\S]*?)(\n---)/);
  if (!m) throw new Error(`Frontmatter não encontrado em ${mdxPath}`);
  writeFileSync(mdxPath, `${m[1]}\ntabnews: "${url}"${m[2]}${src.slice(m[0].length)}`);
}
```

```ts
// lib/mdx/load-post.ts
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { SITE_URL } from "../syndication/config.ts";
import type { SourcePost } from "../syndication/types.ts";

/** Deriva o permalink PT do caminho content/posts/AAAA/MM/DD/slug/index.mdx */
export function permalinkFromPath(mdxPath: string): string {
  const m = mdxPath.replace(/\\/g, "/").match(/content\/posts\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/index\.mdx$/);
  if (!m) throw new Error(`Caminho não é um post PT válido (…/index.mdx): ${mdxPath}`);
  const [, y, mo, d, slug] = m;
  return `/${y}/${mo}/${d}/${slug}`;
}

export function loadPostFromPath(mdxPath: string): SourcePost {
  const permalink = permalinkFromPath(mdxPath);
  const { data, content } = matter(readFileSync(mdxPath, "utf8"));
  return {
    title: String(data.title ?? ""),
    body: content.trim(),
    canonicalUrl: `${SITE_URL}${permalink}`,
    permalink,
    locale: "pt",
    draft: Boolean(data.draft),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  };
}
```

- [ ] **Step 5: Run frontmatter test to verify it passes**

Run: `pnpm exec vitest run lib/mdx/frontmatter.test.ts`
Expected: PASS.

- [ ] **Step 6: Test permalinkFromPath (pura)**

```ts
// lib/mdx/load-post.test.ts
import { describe, it, expect } from "vitest";
import { permalinkFromPath } from "./load-post.ts";

describe("permalinkFromPath", () => {
  it("deriva o permalink do caminho do post", () => {
    expect(permalinkFromPath("content/posts/2026/07/18/arquitetura-mental/index.mdx")).toBe("/2026/07/18/arquitetura-mental");
  });
  it("aceita caminho absoluto", () => {
    expect(permalinkFromPath("/x/y/content/posts/2026/05/31/ancora/index.mdx")).toBe("/2026/05/31/ancora");
  });
  it("rejeita caminho que não é post PT", () => {
    expect(() => permalinkFromPath("content/posts/2026/07/18/x/index.en.mdx")).toThrow(/válido/);
  });
});
```

Run: `pnpm exec vitest run lib/mdx/load-post.test.ts`
Expected: PASS (`load-post.ts` já foi escrito no Step 4).

- [ ] **Step 7: Commit**

```bash
git add lib/mdx/frontmatter.ts lib/mdx/frontmatter.test.ts lib/mdx/load-post.ts lib/mdx/load-post.test.ts package.json pnpm-lock.yaml
git commit -m "feat(syndication): frontmatter (marcador tabnews) + loadPostFromPath via gray-matter"
```

---

### Task 6: CLI `pnpm crosspost` (guards, dry-run→editar→publicar)

**Files:**
- Create: `scripts/crosspost.ts`
- Modify: `package.json` (script `crosspost`)
- Modify: `.env.example` (slots TabNews)
- Modify: `.gitignore` (`.syndication/`)

**Interfaces:**
- Consumes: `loadPostFromPath`, `readFrontmatterField`, `writeSyndicationMarker` (Task 5); `buildTabNewsPreview`, `publishToTabNews` (Task 4); `SyndicationFormat` (Task 2).
- Produces: comando `pnpm crosspost <caminho-do-post> [--dry-run] [--format summary|teaser|full] [--draft]`.

- [ ] **Step 1: Write the implementation**

```ts
// scripts/crosspost.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { loadPostFromPath } from "../lib/mdx/load-post.ts";
import { readFrontmatterField, writeSyndicationMarker } from "../lib/mdx/frontmatter.ts";
import { buildTabNewsPreview, publishToTabNews } from "../lib/syndication/publish-tabnews.ts";
import type { SyndicationFormat } from "../lib/mdx/to-tabnews-markdown.ts";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  if (!target) fail("Uso: pnpm crosspost <caminho-do-post> [--dry-run] [--format summary|teaser|full] [--draft]");

  const dryRun = args.includes("--dry-run");
  const status = args.includes("--draft") ? "draft" : "published";
  const fi = args.indexOf("--format");
  const format = (fi >= 0 ? args[fi + 1] : "summary") as SyndicationFormat;
  if (!["summary", "teaser", "full"].includes(format)) fail(`--format inválido: ${format}`);

  const mdxPath = target.endsWith("index.mdx") ? target : `${target.replace(/\/$/, "")}/index.mdx`;
  if (!existsSync(mdxPath)) fail(`Arquivo não encontrado: ${mdxPath}`);

  const post = loadPostFromPath(mdxPath);
  if (post.draft) fail("Post está draft:true — publique no site antes de sindicar.");
  if (!post.title) fail("Post sem título no frontmatter.");

  const already = readFrontmatterField(mdxPath, "tabnews");
  if (already && !dryRun) fail(`Já sindicado: ${already} (remova o campo tabnews pra republicar).`);

  const slug = basename(mdxPath.replace(/\/index\.mdx$/, ""));
  const previewPath = `.syndication/${slug}.preview.md`;
  const content = buildTabNewsPreview(post, format, status);

  if (dryRun) {
    mkdirSync(".syndication", { recursive: true });
    writeFileSync(previewPath, `<!-- title: ${content.title} | source_url: ${content.sourceUrl} -->\n\n${content.body}\n`);
    console.log(`· dry-run — nada publicado`);
    console.log(`· formato: ${format} | status: ${status}`);
    console.log(`· preview salvo em ${previewPath} — edite e rode sem --dry-run pra publicar essa versão.\n`);
    console.log(content.body);
    return;
  }

  const email = process.env.TABNEWS_EMAIL?.trim();
  const password = process.env.TABNEWS_PASSWORD?.trim();
  if (!email || !password) fail("Defina TABNEWS_EMAIL e TABNEWS_PASSWORD no .env.development.local.");

  // A mão do Vitor manda: se existe preview editado, publica ELE (sem o cabeçalho <!-- ... -->).
  const finalBody = existsSync(previewPath)
    ? readFileSync(previewPath, "utf8").replace(/^<!--[\s\S]*?-->\n?/, "").trim()
    : content.body;

  console.log(`· publicando "${post.title}" no TabNews (${format}${existsSync(previewPath) ? ", preview editado" : ""})…`);
  const result = await publishToTabNews({ ...content, body: finalBody }, format, { email, password });
  writeSyndicationMarker(mdxPath, result.url);
  console.log(`✓ publicado: ${result.url}`);
  console.log(`  marcador gravado em ${mdxPath} — revise o diff e commite.`);
}

main().catch((e: unknown) => fail(errMsg(e)));
```

- [ ] **Step 2: Add script + slots + gitignore**

Em `package.json`, dentro de `"scripts"` (após `"test:watch"`):

```json
"crosspost": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --env-file-if-exists=.env --env-file-if-exists=.env.development.local scripts/crosspost.ts"
```

Em `.env.example`, ao final:

```bash
# --- Cross-post TabNews (autoria local — CLI `pnpm crosspost`) ---
# Uso local apenas: NUNCA NEXT_PUBLIC, nunca na Vercel.
TABNEWS_EMAIL=
TABNEWS_PASSWORD=
```

Em `.gitignore`, ao final:

```
# previews/estado do cross-post (não versionar)
.syndication/
```

- [ ] **Step 3: Smoke-test o dry-run**

Run:
```bash
pnpm crosspost content/posts/2026/07/18/arquitetura-mental-do-agente --dry-run
```
Expected: imprime o resumo com CTA `utm_content=summary`, grava `.syndication/arquitetura-mental-do-agente.preview.md`, **não** chama a rede. (Se esse post não existir na branch, aponte pra qualquer post PT publicado que exista.)

- [ ] **Step 4: Commit**

```bash
git add scripts/crosspost.ts package.json .env.example .gitignore
git commit -m "feat(syndication): CLI pnpm crosspost (dry-run→editar→publicar, guards)"
```

---

### Task 7: Campo `tabnews` no Velite + link "Discuta no TabNews"

**Files:**
- Modify: `velite.config.ts` (schema `postsSchema`)
- Modify: `features/blog/components/PostMeta.tsx`
- Test: `features/blog/components/PostMeta.test.tsx`

**Interfaces:**
- Consumes: campo `tabnews` do post (novo no schema).
- Produces: link visível quando `post.tabnews` existe.

> Nota: componente do Next — imports seguem o padrão do repo (extensionless/`@/`), NÃO `.ts`.

- [ ] **Step 1: Add the schema field**

Em `velite.config.ts`, dentro de `postsSchema`, após `comments: s.boolean().default(false),`:

```ts
  tabnews: s.string().optional(),
```

- [ ] **Step 2: Write the failing test**

```tsx
// features/blog/components/PostMeta.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { PostMeta } from "./PostMeta";

const base = { title: "T", date: "2026-07-18", readingTime: 3, tags: [], locale: "pt" as const };
function renderWith(post: Record<string, unknown>) {
  return render(
    <NextIntlClientProvider locale="pt" messages={{ blog: { readingTime: "{minutes} min" } }}>
      <PostMeta post={post as never} />
    </NextIntlClientProvider>,
  );
}

describe("PostMeta — link do TabNews", () => {
  it("mostra o link quando post.tabnews existe", () => {
    renderWith({ ...base, tabnews: "https://www.tabnews.com.br/vitor/x" });
    expect(screen.getByRole("link", { name: /tabnews/i })).toHaveAttribute("href", "https://www.tabnews.com.br/vitor/x");
  });
  it("não mostra quando não existe", () => {
    renderWith({ ...base });
    expect(screen.queryByRole("link", { name: /tabnews/i })).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run features/blog/components/PostMeta.test.tsx`
Expected: FAIL (sem o link).

- [ ] **Step 4: Add the link to PostMeta**

No JSX de retorno de `PostMeta`, ao final do container raiz (se o tipo de `post` não tiver `tabnews`, use `(post as { tabnews?: string }).tabnews` na condição e no `href`):

```tsx
      {post.tabnews && (
        <a
          href={post.tabnews}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Discuta no TabNews
        </a>
      )}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run features/blog/components/PostMeta.test.tsx`
Expected: PASS.

- [ ] **Step 6: Verify gates + commit**

Run:
```bash
pnpm exec velite build && pnpm typecheck && pnpm lint && pnpm test
```
Expected: tudo verde.

```bash
git add velite.config.ts features/blog/components/PostMeta.tsx features/blog/components/PostMeta.test.tsx
git commit -m "feat(syndication): campo tabnews no velite + link 'Discuta no TabNews'"
```

---

## Verificação final (antes do PR)

- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm exec velite build` — verdes.
- [ ] `pnpm crosspost <post> --dry-run` gera o preview sem rede.
- [ ] Publicação real **só com OK do Vitor**, depois de revisar/editar o `.preview.md`.
- [ ] `.env.development.local` (segredos) nunca aparece no `git status`.

## Cobertura da spec (Fase 1)

| Requisito (spec §12 fase 1) | Task |
| --- | --- |
| lib syndication/tabnews/mdx | 1–5 |
| `pnpm crosspost` | 6 |
| Slots TabNews + `.gitignore` `.syndication/` | 6 |
| Campo `tabnews` no Velite + link no post | 7 |
| Testes transform + cliente + orquestrador | 1,2,3,4,5,7 |
| Primeiro run `--dry-run`; publicar só com OK | 6 + verificação final |
| Modos summary/teaser/full | 2 |

Deferido pra Fase 2 e futuro: Supabase `vitor_*`, log de clique first-party, `crosspost:stats`, `--update`/PATCH, cache de sessão, marcador de corte no MDX.
