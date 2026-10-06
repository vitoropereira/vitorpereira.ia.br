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
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { projects } from "../features/portfolio/data/projects.ts";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORT = { width: 1440, height: 900 };
const OUT_WIDTH = 1280;
const NAV_TIMEOUT_MS = 30_000;
const SETTLE_MS = 2_500;
const LATE_BANNER_MS = 500;
const SEND_TIMEOUT_MS = 15_000;
const CHROME_EXIT_TIMEOUT_MS = 5_000;

type Target = { id: string; url: string };

export function selectTargets(
  list: { id: string; url: string | null }[],
  only?: string[],
): Target[] {
  const withUrl = list.filter(
    (p): p is Target => typeof p.url === "string" && p.url.length > 0,
  );
  if (!only?.length) return withUrl;
  const missing = only.filter((id) => !withUrl.some((p) => p.id === id));
  if (missing.length)
    throw new Error(
      `--only com id sem url ou inexistente: ${missing.join(", ")}`,
    );
  return withUrl.filter((p) => only.includes(p.id));
}

export function outputPathFor(id: string): string {
  return path.posix.join("public", "images", "projects", `${id}.webp`);
}

export function classifyNavigation(
  status: number | undefined,
  finalUrl: string,
  loaded = true,
): "ok" | "http-error" | "no-response" {
  // loaded=false: o evento load não veio no prazo — página meio carregada não vira capa.
  if (!loaded || status === undefined || finalUrl.startsWith("chrome-error://"))
    return "no-response";
  return status >= 400 ? "http-error" : "ok";
}

// ── CDP mínimo ────────────────────────────────────────────────────────────
// Mensagens CDP chegam como JSON solto; cada uso faz o cast do campo que lê.
type Json = Record<string, unknown>;
type CdpMsg = {
  id?: number;
  method?: string;
  params?: Json;
  result?: Json;
  error?: { message: string };
};
type Pending = { resolve: (v: Json) => void; reject: (e: Error) => void };

class Cdp {
  private ws: WebSocket;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private listeners: ((m: CdpMsg) => void)[] = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data)) as CdpMsg;
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result ?? {});
      } else {
        for (const l of this.listeners) l(msg);
      }
    });
    // Socket morto = nenhuma resposta virá; sem isso cada send() ficaria pendurado.
    const failAll = () => {
      for (const p of this.pending.values())
        p.reject(new Error("WebSocket CDP fechou"));
      this.pending.clear();
    };
    ws.addEventListener("close", failAll);
    ws.addEventListener("error", failAll);
    // Diálogo (alert/beforeunload) bloqueia a página; recusa para ela seguir.
    this.on((m) => {
      if (m.method === "Page.javascriptDialogOpening") {
        this.send("Page.handleJavaScriptDialog", { accept: false }).catch(
          () => {},
        );
      }
    });
  }

  static async connect(url: string): Promise<Cdp> {
    const ws = new WebSocket(url);
    await new Promise<void>((res, rej) => {
      ws.addEventListener("open", () => res(), { once: true });
      ws.addEventListener(
        "error",
        () => rej(new Error("WebSocket CDP falhou")),
        { once: true },
      );
    });
    return new Cdp(ws);
  }

  send(method: string, params: object = {}): Promise<Json> {
    const id = ++this.seq;
    return new Promise<Json>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} sem resposta em ${SEND_TIMEOUT_MS}ms`));
      }, SEND_TIMEOUT_MS);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (e) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  on(fn: (m: CdpMsg) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  close() {
    this.ws.close();
  }
}

// Porta 0 + DevToolsActivePort: o Chrome escolhe a porta e a grava no perfil
// que é nosso, então nunca falamos com o Chrome de outra pessoa.
async function waitForDebugger(profile: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const first = (
        await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      const port = Number(first);
      if (Number.isInteger(port) && port > 0) {
        const r = await fetch(`http://127.0.0.1:${port}/json/list`);
        const pages = (await r.json()) as {
          type: string;
          webSocketDebuggerUrl: string;
        }[];
        const page = pages.find((p) => p.type === "page");
        if (page) return page.webSocketDebuggerUrl;
      }
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type DocResponse = { frameId?: string; loaderId?: string; status: number };

async function capture(
  cdp: Cdp,
  t: Target,
): Promise<"ok" | "http-error" | "no-response"> {
  // Respostas Document chegam possivelmente antes de Page.navigate retornar;
  // guardamos todas e filtramos pelo frame/loader principal depois.
  const docs: DocResponse[] = [];
  let loadFired = false;
  let onLoad: () => void = () => {};
  const loaded = new Promise<void>((res) => {
    onLoad = res;
  });
  const off = cdp.on((m) => {
    if (
      m.method === "Network.responseReceived" &&
      m.params?.type === "Document"
    ) {
      docs.push({
        frameId: m.params.frameId as string | undefined,
        loaderId: m.params.loaderId as string | undefined,
        status: (m.params.response as { status: number }).status,
      });
    } else if (m.method === "Page.loadEventFired") {
      loadFired = true;
      onLoad();
    }
  });
  let status: number | undefined;
  let href = "";
  try {
    const nav = await cdp.send("Page.navigate", { url: t.url });
    if (typeof nav.errorText === "string" && nav.errorText)
      return "no-response";
    const frameId = nav.frameId as string | undefined;
    const loaderId = nav.loaderId as string | undefined;
    await Promise.race([loaded, sleep(NAV_TIMEOUT_MS)]);
    // Última resposta do documento principal (após redirects) vence.
    const main = docs.filter(
      (d) =>
        d.frameId === frameId &&
        (loaderId === undefined || d.loaderId === loaderId),
    );
    status = main.at(-1)?.status;
    const evalRes = await cdp.send("Runtime.evaluate", {
      expression: "location.href",
      returnByValue: true,
    });
    href = (evalRes.result as { value?: string } | undefined)?.value ?? "";
  } finally {
    off();
  }
  const verdict = classifyNavigation(status, href, loadFired);
  if (verdict !== "ok") return verdict;

  // Banner pode aparecer tarde: tenta logo após o load e de novo depois do settle.
  await cdp.send("Runtime.evaluate", {
    expression: DISMISS_COOKIES,
    returnByValue: true,
  });
  await sleep(SETTLE_MS);
  await cdp.send("Runtime.evaluate", {
    expression: DISMISS_COOKIES,
    returnByValue: true,
  });
  await sleep(LATE_BANNER_MS);
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const out = outputPathFor(t.id);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(String(shot.data), "base64"))
    .resize({ width: OUT_WIDTH })
    .webp({ quality: 82 })
    .toFile(out);
  return "ok";
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--only");
  const only =
    i >= 0
      ? (argv[i + 1] ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
  const targets = selectTargets(projects, only);

  if (!existsSync(CHROME))
    throw new Error(`Chrome não encontrado em ${CHROME}`);

  const profile = await mkdtemp(path.join(tmpdir(), "gen-shots-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  // Erro de spawn vira rejeição tratada (em vez de exceção não capturada).
  const spawnFailed = new Promise<never>((_, rej) =>
    chrome.once("error", (e) =>
      rej(new Error(`Falha ao iniciar o Chrome: ${e.message}`)),
    ),
  );
  spawnFailed.catch(() => {});
  const report: Record<string, string> = {};
  try {
    const cdp = await Promise.race([
      waitForDebugger(profile).then((u) => Cdp.connect(u)),
      spawnFailed,
    ]);
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      ...VIEWPORT,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: "dark" }],
    });
    for (const t of targets) {
      try {
        report[t.id] = await capture(cdp, t);
      } catch (e) {
        report[t.id] = `erro: ${e instanceof Error ? e.message : String(e)}`;
      }
      console.log(
        `${report[t.id] === "ok" ? "✓" : "✖"} ${t.id} — ${report[t.id]}`,
      );
    }
    cdp.close();
  } finally {
    // Espera o Chrome sair antes de apagar o perfil (ele ainda escreve em
    // Default/ no shutdown), mas com teto: SIGTERM ignorado vira SIGKILL.
    if (chrome.exitCode === null && chrome.signalCode === null) {
      const exited = new Promise<void>((res) =>
        chrome.once("exit", () => res()),
      );
      chrome.kill();
      const timedOut = await Promise.race([
        exited.then(() => false),
        sleep(CHROME_EXIT_TIMEOUT_MS).then(() => true),
      ]);
      if (timedOut) {
        chrome.kill("SIGKILL");
        await Promise.race([exited, sleep(2_000)]);
      }
    }
    await rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }
  const failed = Object.entries(report).filter(([, v]) => v !== "ok");
  if (failed.length) {
    console.log(
      `\n${failed.length} sem print (ficam sem cover): ${failed.map(([k]) => k).join(", ")}`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
