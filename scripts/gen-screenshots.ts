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
): "ok" | "http-error" | "no-response" {
  if (status === undefined || finalUrl.startsWith("chrome-error://"))
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
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise<Json>((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
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

async function waitForDebugger(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = (await r.json()) as {
        type: string;
        webSocketDebuggerUrl: string;
      }[];
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

async function capture(
  cdp: Cdp,
  t: Target,
): Promise<"ok" | "http-error" | "no-response"> {
  let status: number | undefined;
  const off = cdp.on((m) => {
    if (
      m.method === "Network.responseReceived" &&
      m.params?.type === "Document" &&
      status === undefined
    ) {
      status = (m.params.response as { status: number }).status;
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
  await Promise.race([
    loaded,
    new Promise((r) => setTimeout(r, NAV_TIMEOUT_MS)),
  ]);
  off();
  const evalRes = await cdp.send("Runtime.evaluate", {
    expression: "location.href",
    returnByValue: true,
  });
  const href = (evalRes.result as { value?: string } | undefined)?.value ?? "";
  const verdict = classifyNavigation(status, href);
  if (verdict !== "ok") return verdict;

  await cdp.send("Runtime.evaluate", {
    expression: DISMISS_COOKIES,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, SETTLE_MS));
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

  const profile = await mkdtemp(path.join(tmpdir(), "gen-shots-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const report: Record<string, string> = {};
  try {
    const cdp = await Cdp.connect(await waitForDebugger());
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
    // Espera o Chrome sair antes de apagar o perfil: ele ainda escreve em
    // Default/ durante o shutdown e o rm cai em ENOTEMPTY.
    const exited = new Promise<void>((res) => chrome.once("exit", () => res()));
    chrome.kill();
    await exited;
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
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
