# Redesign ③ — Imagens (prints dos projetos + capas dos posts) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preencher a infraestrutura de imagem que já existe e está vazia: print real do site de cada um dos 15 projetos do portfólio e capa no estilo 3D existente para os 15 posts públicos que ainda não têm.

**Architecture:** Dois CLIs locais de autoria (rodam no type-stripping do Node, nunca na Vercel). `gen:screenshots` sobe o Chrome do sistema em headless e fala CDP por WebSocket nativo do Node (zero dependência); `gen:cover` ganha um preâmbulo de estilo versionado. O site já renderiza `cover` de post (card, topo, OG) e de projeto (`ProjectCard`); só o `ProjectCard` ganha a moldura de navegador. Toda imagem passa por um portão de aprovação do Vitor antes do commit.

**Tech Stack:** Node 24 (type-stripping, `WebSocket` global), Chrome headless + CDP, `sharp` (já dependência), `@google/genai` (já dependência, modelo Flash "Nano Banana"), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-site-redesign-design.md` (§6)

## Global Constraints

- CLIs em `scripts/`: imports locais com extensão `.ts` explícita; nada de `enum`, `namespace` ou parameter property no grafo.
- Zero dependência nova.
- Estilo das capas: o 3D render das 2 capas existentes (`content/posts/2026/05/31/chatbot-nao-e-agente/assets/cover.webp` e `content/posts/2026/07/18/arquitetura-mental-do-agente/assets/cover.webp`), passadas como `--ref`. Essas 2 não são regeradas.
- Rascunhos (`hello-world`, `only-pt-draft`) ficam sem capa.
- Nenhuma imagem é commitada antes de o Vitor aprovar a folha de contato.
- Prints: recusar banner de cookie quando houver; nunca aceitar.
- `GOOGLE_API_KEY` vem do `.env`/`.env.development.local` **deste** repo; não ler `.env` de outro repo.
- Commits em conventional commits, pt-BR, terminando com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Worktree `../vitorpereira.ia.br-imagens`, branch `feat/imagens-site` a partir de `origin/main`.

## Review Focus

1. **Site de projeto fora do ar, lento ou com redirect** → o script não pode travar nem gravar uma tela de erro como capa. Esperado: timeout por site, status HTTP ≥ 400 é falha, o projeto é pulado e listado no relatório final. Teste em Task 2 (`classifyNavigation`).
2. **`cover` apontando para arquivo que não existe** → `next/image` quebra a página do portfólio no build. Esperado: teste de integridade que falha se algum `cover` não tiver arquivo em `public/images/projects/`. Teste em Task 4.
3. **Post com `cover.prompt.txt` ainda no placeholder `TODO`** → `gen:cover` gastaria uma chamada paga gerando lixo. Esperado: falha antes da API. Teste em Task 1.
4. **Rodar `gen:cover` de novo num post que já tem capa** → já protegido por `--force` no script atual; o plano não usa `--force` fora da regeneração de capas vetadas.
5. **Domínio na moldura do `ProjectCard` com `url: null`** → card renderiza sem moldura de domínio, sem lançar. Teste em Task 3.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `content/cover-style.txt` (create) | preâmbulo de estilo 3D, fonte única |
| `scripts/gen-cover.ts` (modify) | compõe preâmbulo + assunto; recusa prompt `TODO` |
| `scripts/gen-cover.test.ts` (modify) | testes de `composeCoverPrompt` |
| `scripts/new-post.ts` (modify) | cria `cover.prompt.txt` por padrão (`--no-cover-prompt` desliga) |
| `scripts/gen-screenshots.ts` (create) | CLI de prints via CDP |
| `scripts/gen-screenshots.test.ts` (create) | testes das funções puras |
| `package.json` (modify) | script `gen:screenshots` |
| `features/portfolio/components/ProjectCard.tsx` (modify) | moldura de navegador + hover |
| `features/portfolio/components/ProjectCard.test.tsx` (create) | moldura com/sem url |
| `features/portfolio/data/projects.ts` (modify) | `cover: "<id>.webp"` |
| `features/portfolio/data/projects.test.ts` (create) | integridade cover ↔ arquivo |
| `public/images/projects/*.webp` (create) | prints |
| `content/posts/**/cover.prompt.txt` + `assets/cover.webp` (create) | 15 capas |
| `docs/redesign/` (create) | folhas de contato para aprovação |

---

### Task 0: Worktree

- [ ] **Step 1**

```bash
cd /Users/vop12/projects/vitorpereira.ia.br
git fetch -q
git worktree add -b feat/imagens-site ../vitorpereira.ia.br-imagens origin/main
cd ../vitorpereira.ia.br-imagens
git branch --show-current   # feat/imagens-site
pnpm install && pnpm test
```

O `.env.development.local` é gitignored e não vem com o worktree. Criar um symlink para o do clone principal — é o mesmo repo, não é "`.env` de outro repo":

```bash
ln -s ../vitorpereira.ia.br/.env.development.local .env.development.local
grep -cE '^(GOOGLE_API_KEY|GEMINI_API_KEY|GOOGLE_GEMINI_API_KEY)=' .env.development.local   # esperado: ≥ 1
```

Se der 0, pare e peça a chave ao Vitor.

---

### Task 1: Preâmbulo de estilo no `gen:cover` + `new:post`

**Files:**
- Create: `content/cover-style.txt`
- Modify: `scripts/gen-cover.ts` (função `resolvePrompt`, linhas ~187-195), `scripts/gen-cover.test.ts`, `scripts/new-post.ts`

**Interfaces:**
- Produces: `export function composeCoverPrompt(style: string, subject: string): string` — lança `Error` se `subject` estiver vazio ou começar com `TODO`.

- [ ] **Step 1: `content/cover-style.txt`**

```text
Premium 3D product-render illustration, 16:9, for a technical blog cover.
Match the reference images' style exactly: soft studio lighting, matte rounded
3D tiles and blocks floating over a smooth gradient background that goes from
near-black graphite on the left to soft light grey on the right. Thin glowing
electric-blue (#24C8FF) connection wires with small light nodes, plus a few
subtle amber accent dots. Each tile carries at most one minimal glyph icon.
Lots of negative space, clean, calm, minimal.

Strictly avoid: any text, letters or numbers rendered in the image; robots,
humanoid faces, glowing blue brains, matrix rain, literal circuit-board cliches;
clutter or neon overload. Aesthetic reference: Vercel / Linear / Raycast dark
premium product design. One electric-blue accent, everything else neutral.
```

- [ ] **Step 2: Teste**

Acrescentar a `scripts/gen-cover.test.ts` (ajustar o import existente do módulo para incluir `composeCoverPrompt`):

```ts
describe("composeCoverPrompt", () => {
  it("põe o preâmbulo de estilo antes do assunto do post", () => {
    const out = composeCoverPrompt("STYLE", "two arrows into one stamp");
    expect(out.indexOf("STYLE")).toBeLessThan(out.indexOf("two arrows"));
    expect(out).toContain("Composition for this post:");
  });

  it("recusa o placeholder TODO antes de gastar chamada de API", () => {
    expect(() => composeCoverPrompt("STYLE", "TODO: prompt da capa.")).toThrow(/TODO/);
  });

  it("recusa assunto vazio", () => {
    expect(() => composeCoverPrompt("STYLE", "   ")).toThrow();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm vitest run scripts/gen-cover.test.ts`
Expected: FAIL — `composeCoverPrompt` não exportado.

- [ ] **Step 4: Implementar em `scripts/gen-cover.ts`**

Adicionar perto de `resolvePrompt`:

```ts
const STYLE_FILE = path.join("content", "cover-style.txt");

// O estilo vive num arquivo só para as capas novas saírem coesas com as
// existentes sem cada cover.prompt.txt repetir (e divergir) o preâmbulo.
export function composeCoverPrompt(style: string, subject: string): string {
  const s = subject.trim();
  if (!s) throw new Error("Prompt da capa vazio.");
  if (/^TODO\b/.test(s)) {
    throw new Error("cover.prompt.txt ainda está no placeholder TODO — escreva o assunto antes de gerar.");
  }
  return `${style.trim()}\n\nComposition for this post:\n${s}`;
}
```

E, dentro de `resolvePrompt`, no caminho que lê arquivo (não no `--prompt` inline, que continua literal), trocar o `return text;` final por:

```ts
  const style = existsSync(STYLE_FILE) ? await readFile(STYLE_FILE, "utf8") : "";
  try {
    return style ? composeCoverPrompt(style, text) : composeCoverPrompt("", text).trimStart();
  } catch (e) {
    return fail(errMsg(e));
  }
```

Atualizar o comentário de cabeçalho do arquivo com uma linha: ` *   O conteúdo de content/cover-style.txt é prefixado a todo prompt lido de arquivo.`

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run scripts/gen-cover.test.ts`
Expected: todos passam (os antigos inclusive).

- [ ] **Step 6: `new:post` cria `cover.prompt.txt` por padrão**

Em `scripts/new-post.ts`: `let coverPrompt = true;`, trocar o ramo `--cover-prompt` por:

```ts
    else if (a === "--cover-prompt") coverPrompt = true;
    else if (a === "--no-cover-prompt") coverPrompt = false;
```

E no texto do placeholder:

```ts
      writeFileSync(
        promptPath,
        "TODO: descreva só a composição da capa (o estilo vem de content/cover-style.txt). Rode `pnpm gen:cover --post " +
          dir +
          " --attach-frontmatter`.\n",
      );
```

Atualizar o comentário de flags no topo: `--cover-prompt` vira padrão; documentar `--no-cover-prompt`.

- [ ] **Step 7: Dry-run de fumaça**

```bash
pnpm gen:cover --post content/posts/2026/09/21/idempotencia-efeito-externo --dry-run --prompt "smoke"
```
Expected: sai sem chamar API (valida que nada quebrou na leitura de args).

- [ ] **Step 8: Commit**

```bash
git add content/cover-style.txt scripts/gen-cover.ts scripts/gen-cover.test.ts scripts/new-post.ts
git commit -m "feat(editorial): preâmbulo de estilo versionado para capas

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `gen:screenshots`

**Files:**
- Create: `scripts/gen-screenshots.ts`, `scripts/gen-screenshots.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `projects` de `features/portfolio/data/projects.ts` (import `../features/portfolio/data/projects.ts`; esse arquivo só importa `type` de `../types`, então o Node type-stripping resolve).
- Produces:
  ```ts
  export function selectTargets(list: { id: string; url: string | null }[], only?: string[]): { id: string; url: string }[];
  export function outputPathFor(id: string): string;              // "public/images/projects/<id>.webp"
  export function classifyNavigation(status: number | undefined, finalUrl: string): "ok" | "http-error" | "no-response";
  ```

- [ ] **Step 1: Teste das funções puras**

`scripts/gen-screenshots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyNavigation, outputPathFor, selectTargets } from "./gen-screenshots.ts";

describe("selectTargets", () => {
  const list = [
    { id: "a", url: "https://a.com" },
    { id: "b", url: null },
    { id: "c", url: "https://c.com" },
  ];
  it("ignora projeto sem url", () => {
    expect(selectTargets(list).map((t) => t.id)).toEqual(["a", "c"]);
  });
  it("filtra por --only", () => {
    expect(selectTargets(list, ["c"]).map((t) => t.id)).toEqual(["c"]);
  });
  it("--only com id inexistente lança, para não rodar em silêncio sem nada", () => {
    expect(() => selectTargets(list, ["zzz"])).toThrow(/zzz/);
  });
});

describe("outputPathFor", () => {
  it("grava em public/images/projects/<id>.webp", () => {
    expect(outputPathFor("clearseg")).toBe("public/images/projects/clearseg.webp");
  });
});

describe("classifyNavigation", () => {
  it("2xx/3xx final é ok", () => {
    expect(classifyNavigation(200, "https://x.com/")).toBe("ok");
  });
  it("4xx/5xx é erro — não vira capa", () => {
    expect(classifyNavigation(503, "https://x.com/")).toBe("http-error");
    expect(classifyNavigation(404, "https://x.com/")).toBe("http-error");
  });
  it("sem status (timeout, DNS) é no-response", () => {
    expect(classifyNavigation(undefined, "")).toBe("no-response");
  });
  it("chrome-error:// é no-response mesmo com status", () => {
    expect(classifyNavigation(200, "chrome-error://chromewebdata/")).toBe("no-response");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run scripts/gen-screenshots.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `scripts/gen-screenshots.ts`**

```ts
/**
 * gen-screenshots — print da primeira dobra do site de cada projeto do portfólio.
 *
 * Uso LOCAL (autoria). Usa o Chrome do sistema em headless e fala CDP por
 * WebSocket nativo do Node — sem puppeteer/playwright.
 *
 *   pnpm gen:screenshots                 # todos os projetos com url
 *   pnpm gen:screenshots --only a,b      # só esses ids
 *
 * Viewport vem de Emulation.setDeviceMetricsOverride: --window-size do Chrome
 * headless só recorta o PNG, não define o viewport.
 */
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { projects } from "../features/portfolio/data/projects.ts";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const VIEWPORT = { width: 1440, height: 900 };
const OUT_WIDTH = 1280;
const NAV_TIMEOUT_MS = 30_000;
const SETTLE_MS = 2_500;

type Target = { id: string; url: string };

export function selectTargets(
  list: { id: string; url: string | null }[],
  only?: string[],
): Target[] {
  const withUrl = list.filter((p): p is Target => typeof p.url === "string" && p.url.length > 0);
  if (!only?.length) return withUrl;
  const missing = only.filter((id) => !withUrl.some((p) => p.id === id));
  if (missing.length) throw new Error(`--only com id sem url ou inexistente: ${missing.join(", ")}`);
  return withUrl.filter((p) => only.includes(p.id));
}

export function outputPathFor(id: string): string {
  return path.posix.join("public", "images", "projects", `${id}.webp`);
}

export function classifyNavigation(
  status: number | undefined,
  finalUrl: string,
): "ok" | "http-error" | "no-response" {
  if (status === undefined || finalUrl.startsWith("chrome-error://")) return "no-response";
  return status >= 400 ? "http-error" : "ok";
}

// ── CDP mínimo ────────────────────────────────────────────────────────────
type Pending = { resolve: (v: any) => void; reject: (e: Error) => void };

class Cdp {
  private ws: WebSocket;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private listeners: ((m: any) => void)[] = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      } else {
        for (const l of this.listeners) l(msg);
      }
    });
  }

  static async connect(url: string): Promise<Cdp> {
    const ws = new WebSocket(url);
    await new Promise<void>((res, rej) => {
      ws.addEventListener("open", () => res(), { once: true });
      ws.addEventListener("error", () => rej(new Error("WebSocket CDP falhou")), { once: true });
    });
    return new Cdp(ws);
  }

  send(method: string, params: object = {}): Promise<any> {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(fn: (m: any) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  close() {
    this.ws.close();
  }
}

async function waitForDebugger(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = (await r.json()) as { type: string; webSocketDebuggerUrl: string }[];
      const page = pages.find((p) => p.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome ainda subindo
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Chrome não abriu a porta de debug a tempo.");
}

// Recusa banner de cookie quando o botão é reconhecível; nunca aceita.
const DISMISS_COOKIES = `(() => {
  const words = /^(recusar|rejeitar|reject|decline|deny|only necessary|apenas necess)/i;
  const btn = [...document.querySelectorAll("button, a[role=button]")]
    .find((b) => words.test((b.textContent || "").trim()));
  if (btn) { btn.click(); return true; }
  return false;
})()`;

async function capture(cdp: Cdp, t: Target): Promise<"ok" | "http-error" | "no-response"> {
  let status: number | undefined;
  const off = cdp.on((m) => {
    if (m.method === "Network.responseReceived" && m.params.type === "Document" && status === undefined) {
      status = m.params.response.status;
    }
  });
  const loaded = new Promise<void>((res) => {
    const offLoad = cdp.on((m) => {
      if (m.method === "Page.loadEventFired") {
        offLoad();
        res();
      }
    });
  });
  await cdp.send("Page.navigate", { url: t.url });
  await Promise.race([loaded, new Promise((r) => setTimeout(r, NAV_TIMEOUT_MS))]);
  off();
  const { result } = await cdp.send("Runtime.evaluate", { expression: "location.href", returnByValue: true });
  const verdict = classifyNavigation(status, String(result.value ?? ""));
  if (verdict !== "ok") return verdict;

  await cdp.send("Runtime.evaluate", { expression: DISMISS_COOKIES, returnByValue: true });
  await new Promise((r) => setTimeout(r, SETTLE_MS));
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const out = outputPathFor(t.id);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(shot.data, "base64")).resize({ width: OUT_WIDTH }).webp({ quality: 82 }).toFile(out);
  return "ok";
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--only");
  const only = i >= 0 ? (argv[i + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  const targets = selectTargets(projects, only);

  const profile = await mkdtemp(path.join(tmpdir(), "gen-shots-"));
  const chrome = spawn(
    CHROME,
    ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "about:blank"],
    { stdio: "ignore" },
  );
  const report: Record<string, string> = {};
  try {
    const cdp = await Cdp.connect(await waitForDebugger());
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 2, mobile: false });
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
    for (const t of targets) {
      try {
        report[t.id] = await capture(cdp, t);
      } catch (e) {
        report[t.id] = `erro: ${e instanceof Error ? e.message : String(e)}`;
      }
      console.log(`${report[t.id] === "ok" ? "✓" : "✖"} ${t.id} — ${report[t.id]}`);
    }
    cdp.close();
  } finally {
    chrome.kill();
    await rm(profile, { recursive: true, force: true });
  }
  const failed = Object.entries(report).filter(([, v]) => v !== "ok");
  if (failed.length) {
    console.log(`\n${failed.length} sem print (ficam sem cover): ${failed.map(([k]) => k).join(", ")}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run scripts/gen-screenshots.test.ts`
Expected: todos passam.

- [ ] **Step 5: Script no `package.json`**

Ao lado de `gen:cover`:

```json
"gen:screenshots": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/gen-screenshots.ts",
```

- [ ] **Step 6: Fumaça com um projeto**

Run: `pnpm gen:screenshots --only clearseg`
Expected: `✓ clearseg — ok` e `public/images/projects/clearseg.webp` existe com 1280px de largura (`sips -g pixelWidth public/images/projects/clearseg.webp`). Abrir e olhar a imagem.

- [ ] **Step 7: Lint/typecheck e commit (só código, sem imagem)**

Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add scripts/gen-screenshots.ts scripts/gen-screenshots.test.ts package.json
git commit -m "feat(portfolio): CLI gen:screenshots via CDP para prints dos projetos

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Moldura de navegador no `ProjectCard`

**Files:**
- Modify: `features/portfolio/components/ProjectCard.tsx`
- Create: `features/portfolio/components/ProjectCard.test.tsx`

**Interfaces:**
- Produces: `export function domainOf(url: string | null): string | null` (no mesmo arquivo do card) — `"https://www.sarcorps.com.br/pt"` → `"sarcorps.com.br"`.

- [ ] **Step 1: Teste**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard, domainOf } from "./ProjectCard";
import { projects } from "../data/projects";

const base = projects[0]!;

describe("domainOf", () => {
  it("tira protocolo, www e caminho", () => {
    expect(domainOf("https://www.sarcorps.com.br/pt")).toBe("sarcorps.com.br");
  });
  it("null para url ausente ou inválida", () => {
    expect(domainOf(null)).toBeNull();
    expect(domainOf("não é url")).toBeNull();
  });
});

describe("ProjectCard", () => {
  it("com cover e url mostra a moldura com o domínio", () => {
    render(<ProjectCard project={{ ...base, cover: "x.webp", url: "https://clearseg.com.br" }} locale="pt" />);
    expect(screen.getByText("clearseg.com.br")).toBeInTheDocument();
  });

  it("com cover e sem url renderiza a imagem sem domínio, sem lançar", () => {
    const { container } = render(<ProjectCard project={{ ...base, cover: "x.webp", url: null }} locale="pt" />);
    expect(container.querySelector("img")).not.toBeNull();
    expect(screen.queryByText("clearseg.com.br")).toBeNull();
  });

  it("sem cover não renderiza moldura", () => {
    const { container } = render(<ProjectCard project={{ ...base, cover: null }} locale="pt" />);
    expect(container.querySelector("[data-browser-frame]")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run features/portfolio/components/ProjectCard.test.tsx`
Expected: FAIL — `domainOf` não exportado.

- [ ] **Step 3: Implementar**

Em `ProjectCard.tsx`, adicionar:

```tsx
export function domainOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
```

Trocar o bloco `{project.cover && (<Image ... />)}` por:

```tsx
      {project.cover && (
        <div data-browser-frame className="border-b">
          <div className="bg-muted flex items-center gap-1.5 px-3 py-2">
            <span className="size-2 rounded-full bg-[#FF5F57]" aria-hidden />
            <span className="size-2 rounded-full bg-[#FEBC2E]" aria-hidden />
            <span className="size-2 rounded-full bg-[#28C840]" aria-hidden />
            {domainOf(project.url) && (
              <span className="text-muted-foreground ml-2 truncate font-mono text-[11px]">
                {domainOf(project.url)}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <Image
              src={`/images/projects/${project.cover}`}
              alt=""
              width={1280}
              height={800}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </div>
      )}
```

E no `<article>`, trocar `transition-shadow hover:shadow-md` por `group card-interactive` (a classe vem do PR ①; se o PR ① ainda não estiver na main quando este for mergeado, `card-interactive` é inerte e nada quebra).

A proporção 16/10 casa com a captura 1440×900.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run features/portfolio/components/ProjectCard.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add features/portfolio/components/ProjectCard.tsx features/portfolio/components/ProjectCard.test.tsx
git commit -m "feat(portfolio): moldura de navegador nos prints dos projetos

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Gerar prints, portão do Vitor, ligar `cover`

**Files:**
- Create: `public/images/projects/*.webp`, `features/portfolio/data/projects.test.ts`, `docs/redesign/prints-projetos.png`
- Modify: `features/portfolio/data/projects.ts`

- [ ] **Step 1: Teste de integridade (falha agora, porque ainda não há cover — e passa trivialmente; por isso o segundo caso)**

`features/portfolio/data/projects.test.ts`:

```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projects } from "./projects";

describe("projects cover", () => {
  it("todo cover aponta para um arquivo existente em public/images/projects", () => {
    const missing = projects
      .filter((p) => p.cover)
      .filter((p) => !existsSync(path.join("public", "images", "projects", p.cover!)))
      .map((p) => `${p.id} → ${p.cover}`);
    expect(missing).toEqual([]);
  });

  it("todo projeto em destaque com url tem print", () => {
    const semPrint = projects.filter((p) => p.featured && p.url && !p.cover).map((p) => p.id);
    expect(semPrint).toEqual([]);
  });
});
```

Run: `pnpm vitest run features/portfolio/data/projects.test.ts`
Expected: o segundo caso FALHA listando os 8 ids em destaque.

- [ ] **Step 2: Gerar todos os prints**

Run: `pnpm gen:screenshots`
Expected: uma linha por projeto. Anotar os `✖`.

- [ ] **Step 3: Folha de contato e portão**

```bash
mkdir -p docs/redesign
node --input-type=module -e '
import sharp from "sharp"; import { readdirSync } from "node:fs";
const dir = "public/images/projects"; const files = readdirSync(dir).filter(f => f.endsWith(".webp")).sort();
const W = 640, H = 400, cols = 3, rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map(async (f, i) => ({
  input: await sharp(`${dir}/${f}`).resize(W, H, { fit: "cover", position: "top" }).png().toBuffer(),
  left: (i % cols) * (W + 16), top: Math.floor(i / cols) * (H + 48) }));
const labels = files.map((f, i) => `<text x="${(i % cols) * (W + 16) + 8}" y="${Math.floor(i / cols) * (H + 48) + H + 30}" font-family="monospace" font-size="22" fill="#E9EEF7">${f}</text>`).join("");
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*(W+16)}" height="${rows*(H+48)}">${labels}</svg>`);
await sharp({ create: { width: cols*(W+16), height: rows*(H+48), channels: 3, background: "#070B12" } })
  .composite([...tiles, { input: svg, left: 0, top: 0 }]).png().toFile("docs/redesign/prints-projetos.png");
'
open docs/redesign/prints-projetos.png
```

Olhar a folha você mesmo primeiro: banner de cookie que ficou, tela de erro, página em branco, conteúdo de login. Recapturar problemas com `--only <id>` antes de mostrar.

**PARE.** Mostrar a folha ao Vitor com a lista de falhas e perguntar: (a) algum print a vetar/recapturar? (b) algum projeto que ele prefere não exibir? Só seguir com a aprovação.

- [ ] **Step 4: Ligar os covers aprovados**

Em `features/portfolio/data/projects.ts`, para cada id aprovado, trocar o `cover: null,` daquele objeto por `cover: "<id>.webp",`. Apagar os `.webp` vetados de `public/images/projects/`.

- [ ] **Step 5: Teste de integridade passa**

Run: `pnpm vitest run features/portfolio/data/projects.test.ts`
Expected: os 2 passam. Se um projeto em destaque ficou sem print por veto do Vitor, ajustar o segundo teste para ter uma lista explícita `const SEM_PRINT_APROVADO = ["<id>"]` comentada com o motivo — não apagar o teste.

- [ ] **Step 6: Commit**

```bash
git add public/images/projects features/portfolio/data/projects.ts features/portfolio/data/projects.test.ts docs/redesign/prints-projetos.png
git commit -m "feat(portfolio): prints reais dos sites dos projetos

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 15 capas de post — prompts, geração, portão

**Files:**
- Create: `content/posts/<post>/cover.prompt.txt` e `content/posts/<post>/assets/cover.webp` para os 15 abaixo
- Modify: `index.mdx` / `index.en.mdx` desses posts (frontmatter `cover:`, via `--attach-frontmatter`)
- Create: `docs/redesign/capas-posts.png`

- [ ] **Step 1: Escrever os 15 `cover.prompt.txt`**

Só a composição (o estilo vem do `content/cover-style.txt`). Um arquivo por pasta, com exatamente este conteúdo:

| Post (`content/posts/2026/…`) | `cover.prompt.txt` |
|---|---|
| `07/25/ferramentas-como-contrato` | A row of five matte tiles, each a tool glyph (wrench, envelope, database cylinder, calendar, padlock), each tile sitting inside a thin glowing blue outlined frame like a contract boundary; one darker agent cube on the left sends a single blue wire that only plugs into the frames' defined sockets. |
| `08/04/nove-numeros-banidos` | Ten small matte phone-shaped tiles in a grid; nine of them dimmed and tipped over with their blue wires cut, one still upright and lit; on the right, a new sturdier stack of tiles being assembled, connected by fresh blue wires. |
| `08/06/fila-que-guarda-o-payload-cru` | A long translucent matte tray holding a queue of small sealed envelope-tiles in order; above it, a processing tile with a broken wire spark (amber), while the envelopes in the tray stay intact and glowing softly blue. |
| `08/08/idor-a-fronteira-e-o-servidor` | Two separate groups of matte document tiles on the left and right, divided by a tall glowing blue vertical wall; a single key-shaped tile is stopped against the wall, unable to pass; a shield glyph tile sits on top of the wall. |
| `08/11/memoria-de-agente` | A wide funnel made of thin blue wire rings; many small scattered matte fragments enter at the top, only three well-formed tiles come out at the bottom into a neat small shelf; the rest fade away into the gradient. |
| `08/13/avaliar-agente-quatro-eixos` | A central dark agent cube with four blue wires going to four tiles arranged as a cross: a target glyph, a winding path glyph, a shield glyph and a coin glyph; the path tile is highlighted with one amber dot. |
| `08/15/limites-do-agente` | Three concentric rounded platforms like steps, labeled only by glyphs: an eye (read), a clipboard (prepare), a pen (write); the agent cube sits on the outer step and a thin blue gate stands before the inner pen step. |
| `08/18/llms-txt-funciona` | A single flat matte document tile with a few simple horizontal lines (no letters) at the center, with thin blue wires fanning out to several small anonymous crawler tiles; some wires connect, some stop short and fade. |
| `08/19/demo-ao-vivo-de-agente` | A small matte stage platform with a screen tile showing a frozen loading ring glyph; three tiny abstract audience pucks in front; a single simple lever tile at the side glowing blue, the one thing that works. |
| `09/13/agente-nao-amadurece-no-prompt` | On the left, a lone terminal tile with a caret glyph; on the right, the same agent cube surrounded by real-world tiles: a wifi glyph with a dimmed bar, a blocked channel glyph, and a printed QR-like square pattern tile (abstract squares, no readable code); blue wires reconnect them. |
| `09/17/logs-para-operar-agentes` | A vertical timeline of five stacked thin matte tiles, each with a different glyph (link chain, decision fork, wrench, state arrows, hand-off hand), connected by a single blue wire running down the stack like a trace. |
| `09/21/idempotencia-efeito-externo` | Two identical blue wires arriving from the left converge into a single matte stamp-shaped tile; on the right, exactly one document tile is produced; a faint ghost of a second document is crossed out with an amber dot. |
| `10/01/mdx-nao-e-so-texto` | A matte document tile on the left with simple lines; from it, blue wires lead to a row of tiles representing a route path glyph, a sitemap tree glyph, a globe glyph and a checklist glyph, with a small gate tile with a check mark in the middle of the wires. |
| `10/05/claude-code-projetou-a-eleicao` | A matte ballot-box-shaped tile on the left feeding blue wires into a dark agent cube; out of the cube, a smooth rising line chart rendered as a thin blue wire with a confidence band, and two small source tiles cross-checking it with linked wires; no numbers. |
| `10/05/read-only-nao-e-politica-de-seguranca` | A matte tool tile with an open eye glyph and a small "lock-off" closed padlock tag hanging from it, yet a blue wire still runs from it into a stack of sensitive document tiles; around the wire, a thin gate, a rate meter dial and a filter funnel tile actually guard the flow. |

- [ ] **Step 2: Dry-run de todos**

```bash
REFS="--ref content/posts/2026/05/31/chatbot-nao-e-agente/assets/cover.webp --ref content/posts/2026/07/18/arquitetura-mental-do-agente/assets/cover.webp"
for p in 07/25/ferramentas-como-contrato 08/04/nove-numeros-banidos 08/06/fila-que-guarda-o-payload-cru 08/08/idor-a-fronteira-e-o-servidor 08/11/memoria-de-agente 08/13/avaliar-agente-quatro-eixos 08/15/limites-do-agente 08/18/llms-txt-funciona 08/19/demo-ao-vivo-de-agente 09/13/agente-nao-amadurece-no-prompt 09/17/logs-para-operar-agentes 09/21/idempotencia-efeito-externo 10/01/mdx-nao-e-so-texto 10/05/claude-code-projetou-a-eleicao 10/05/read-only-nao-e-politica-de-seguranca; do
  pnpm -s gen:cover --post content/posts/2026/$p $REFS --attach-frontmatter --dry-run || echo "FALHOU $p"
done
```
Expected: nenhum `FALHOU`.

- [ ] **Step 3: Uma capa piloto**

Gerar só `09/21/idempotencia-efeito-externo` (mesmo comando sem `--dry-run`). Abrir a `.webp` e comparar lado a lado com as 2 de referência. Se o estilo destoar, ajustar `content/cover-style.txt` e regerar com `--force` antes de seguir — não gaste as outras 14 num estilo errado.

- [ ] **Step 4: As outras 14**

Rodar o laço do Step 2 sem `--dry-run`, pulando a piloto. Anotar falhas (modalidade, quota).

- [ ] **Step 5: Folha de contato e portão**

Mesmo script de colagem da Task 4 Step 3, apontando para as 17 `content/posts/**/assets/cover.webp` (15 novas + 2 existentes, rótulo = slug), saída `docs/redesign/capas-posts.png`. Olhar primeiro: texto renderizado na imagem, rosto/robô, cor fora da paleta → regerar com `--force` antes de mostrar.

**PARE.** Mostrar ao Vitor. Regerar só as vetadas (`--force`), nova folha, até aprovar.

- [ ] **Step 6: Build e verificação**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: verde (o Velite processa as 15 imagens novas).

Screenshot real (CDP, 1440 e 375): `/posts`, um post com capa nova, `/en/posts`, home (Casos e Últimos posts) — capas aparecem, sem distorção.

- [ ] **Step 7: Commit e PR**

```bash
git add content/posts docs/redesign/capas-posts.png
git commit -m "feat(blog): capas no estilo 3D para os 15 posts sem capa

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
gh auth switch -u vitoropereira
git push -u origin feat/imagens-site
gh pr create --base main --title "feat: prints dos projetos e capas dos posts" --body "..."
```

Corpo do PR: o que foi gerado, as duas folhas de contato em `docs/redesign/`, os ids sem print e por quê, e test plan.
