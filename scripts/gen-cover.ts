/**
 * gen-cover — gera capas de post com a API de imagem do Google ("Nano Banana").
 *
 * Uso LOCAL (autoria) apenas. Precisa de GOOGLE_API_KEY no ambiente (via .env).
 * A imagem gerada é convertida pra .webp e gravada no post; só a .webp é commitada,
 * então o runtime do site nunca precisa da key.
 *
 *   pnpm gen:cover --post content/posts/2026/07/18/arquitetura-mental-do-agente \
 *     --ref content/posts/2026/05/31/chatbot-nao-e-agente/assets/cover.webp
 *
 * Flags:
 *   --post <dir>       atalho: lê <dir>/cover.prompt.txt e grava <dir>/assets/cover.webp
 *   --prompt <str>     prompt inline (alternativa a --post / --prompt-file)
 *   --prompt-file <p>  arquivo com o prompt
 *   --out <p>          caminho de saída (.webp)
 *   --ref <p>          imagem de referência de estilo (repetível: use --ref várias vezes)
 *   --model <id>       override do modelo
 *   --pro              usa o modelo Pro (melhor pra texto legível na imagem)
 *   --size <WxH>       dimensão final (default 1672x941)
 *   --list-models      modo exclusivo: valida a key e lista modelos, sem flags de geração
 *   --dry-run          valida entrada/preflight sem chamar API nem escrever
 *   --attach-frontmatter adiciona cover: aos MDX PT/EN só depois de preflight completo
 *   --force            permite substituir uma capa existente
 *   --allow-modality-retry permite uma segunda tentativa de modalidade (pode cobrar outra chamada)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Modality, type Content, type Part } from "@google/genai";
import sharp from "sharp";

// Model IDs do "Nano Banana". Podem mudar/rotacionar — rode `--list-models` pra
// ver os disponíveis na sua key e use `--model <id>` se algum ID mudar.
const MODEL_FLASH = "gemini-3.1-flash-image";
const MODEL_PRO = "gemini-3-pro-image";
const DEFAULT_SIZE = { width: 1672, height: 941 } as const;

// O gerador histórico thumb-gen usava GOOGLE_GEMINI_API_KEY e o SDK do Google
// documenta GEMINI_API_KEY. Aceitar os aliases evita duplicar/copiar segredo.
const API_KEY_ENV_NAMES = ["GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY"] as const;
type ApiKeyEnvName = (typeof API_KEY_ENV_NAMES)[number];

export function resolveApiKey(): { value?: string; source?: ApiKeyEnvName } {
  for (const source of API_KEY_ENV_NAMES) {
    const value = process.env[source]?.trim();
    if (value) return { value, source };
  }
  return {};
}

export interface Options {
  prompt?: string;
  promptFile?: string;
  post?: string;
  out?: string;
  refs: string[];
  model?: string;
  pro: boolean;
  size: { width: number; height: number };
  sizeSpecified: boolean;
  listModels: boolean;
  dryRun: boolean;
  force: boolean;
  allowModalityRetry: boolean;
  attachFrontmatter: boolean;
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : JSON.stringify(e);
}

function printUsage(): void {
  console.log(
    "pnpm gen:cover --post <dir> [--ref <img>] [--pro] [--size WxH]\n" +
      "               [--prompt <str> | --prompt-file <p>] [--out <p>]\n" +
      "               [--attach-frontmatter] [--force] [--allow-modality-retry]\n" +
      "               [--list-models] [--dry-run]",
  );
}

function parseArgs(argv: string[]): Options {
  const o: Options = {
    refs: [],
    pro: false,
    size: { ...DEFAULT_SIZE },
    sizeSpecified: false,
    listModels: false,
    dryRun: false,
    force: false,
    allowModalityRetry: false,
    attachFrontmatter: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) break;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) fail(`Faltou valor para ${a}`);
      if (!v.trim()) fail(`Valor vazio para ${a}`);
      return v;
    };
    switch (a) {
      case "--prompt":
        o.prompt = next();
        break;
      case "--prompt-file":
        o.promptFile = next();
        break;
      case "--post":
        o.post = next();
        break;
      case "--out":
        o.out = next();
        break;
      case "--ref":
        o.refs.push(next());
        break;
      case "--model":
        o.model = next();
        break;
      case "--pro":
        o.pro = true;
        break;
      case "--size": {
        const m = /^(\d+)x(\d+)$/.exec(next());
        if (!m) fail("--size deve ser no formato WxH, ex.: 1672x941");
        o.size = { width: Number(m[1]), height: Number(m[2]) };
        o.sizeSpecified = true;
        break;
      }
      case "--list-models":
        o.listModels = true;
        break;
      case "--dry-run":
        o.dryRun = true;
        break;
      case "--force":
        o.force = true;
        break;
      case "--allow-modality-retry":
        o.allowModalityRetry = true;
        break;
      case "--attach-frontmatter":
        o.attachFrontmatter = true;
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        fail(`Flag desconhecida: ${a}`);
    }
  }
  return o;
}

/** `--list-models` valida só a credencial; nunca pode iniciar um fluxo de geração. */
export function validateModeCompatibility(o: Options): void {
  if (!o.listModels) return;
  const incompatible = [
    o.prompt && "--prompt",
    o.promptFile && "--prompt-file",
    o.post && "--post",
    o.out && "--out",
    o.refs.length > 0 && "--ref",
    o.model && "--model",
    o.pro && "--pro",
    o.sizeSpecified && "--size",
    o.dryRun && "--dry-run",
    o.force && "--force",
    o.allowModalityRetry && "--allow-modality-retry",
    o.attachFrontmatter && "--attach-frontmatter",
  ].filter(Boolean);
  if (incompatible.length > 0) {
    throw new Error(`--list-models é exclusivo; remova ${incompatible.join(", ")}.`);
  }
}

async function resolvePrompt(o: Options): Promise<string> {
  if (o.prompt) return o.prompt;
  const file = o.promptFile ?? (o.post ? path.join(o.post, "cover.prompt.txt") : undefined);
  if (!file) fail("Informe --prompt, --prompt-file <arquivo> ou --post <dir> (com cover.prompt.txt).");
  if (!existsSync(file)) fail(`Arquivo de prompt não encontrado: ${file}`);
  const text = (await readFile(file, "utf8")).trim();
  if (!text) fail(`Prompt vazio em: ${file}`);
  return text;
}

function resolveOut(o: Options): string {
  if (o.out) return o.out;
  if (o.post) return path.join(o.post, "assets", "cover.webp");
  return fail("Informe --out <arquivo.webp> ou --post <dir>.");
}

function assertOutputWritable(out: string, force: boolean): void {
  if (existsSync(out) && !force) {
    fail(`A capa já existe em ${out}. Use --force somente para substituir uma capa revisada.`);
  }
}

export interface FrontmatterUpdate {
  file: string;
  original: string;
  updated: string;
}

/** Valida TODO o par de posts antes de gastar uma chamada de geração. */
export async function planCoverFrontmatter(post: string, out: string): Promise<FrontmatterUpdate[]> {
  const expectedOut = path.resolve(post, "assets", "cover.webp");
  if (path.resolve(out) !== expectedOut) {
    throw new Error("--attach-frontmatter exige a saída padrão <post>/assets/cover.webp.");
  }

  const updates: FrontmatterUpdate[] = [];
  for (const name of ["index.mdx", "index.en.mdx"]) {
    const file = path.join(post, name);
    if (!existsSync(file)) continue;
    const original = await readFile(file, "utf8");
    if (!original.startsWith("---\n")) throw new Error(`Frontmatter ausente em ${file}.`);
    const end = original.indexOf("\n---", 4);
    if (end === -1) throw new Error(`Frontmatter inválido em ${file}.`);
    const frontmatter = original.slice(4, end);
    const cover = /^cover:\s*(?:"([^"]+)"|'([^']+)'|(\S+))\s*$/m.exec(frontmatter);
    const existingCover = cover?.[1] ?? cover?.[2] ?? cover?.[3];
    if (existingCover && existingCover !== "./assets/cover.webp") {
      throw new Error(`Já existe cover diferente em ${file}; não vou substituir metadata existente.`);
    }
    if (!existingCover) {
      updates.push({
        file,
        original,
        updated: `${original.slice(0, end)}\ncover: "./assets/cover.webp"${original.slice(end)}`,
      });
    }
  }
  return updates;
}

/** Aplica o plano depois da capa existir; em falha, restaura o que já foi escrito. */
async function applyCoverFrontmatter(updates: FrontmatterUpdate[]): Promise<void> {
  const written: FrontmatterUpdate[] = [];
  try {
    for (const update of updates) {
      await writeFile(update.file, update.updated);
      written.push(update);
      console.log(`· frontmatter atualizado: ${update.file}`);
    }
  } catch (err) {
    await Promise.all(written.map((update) => writeFile(update.file, update.original)));
    throw err;
  }
}

function mimeOf(p: string): string {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return fail(`Extensão de imagem não suportada em --ref: ${p} (use .png, .webp ou .jpg)`);
}

async function buildContents(prompt: string, refs: string[]): Promise<Content[]> {
  const parts: Part[] = [{ text: prompt }];
  for (const r of refs) {
    if (!existsSync(r)) fail(`--ref não encontrado: ${r}`);
    const data = (await readFile(r)).toString("base64");
    parts.push({ inlineData: { mimeType: mimeOf(r), data } });
  }
  return [{ role: "user", parts }];
}

async function generateImage(
  ai: GoogleGenAI,
  model: string,
  contents: Content[],
  allowModalityRetry: boolean,
): Promise<string> {
  // Retry de modalidade pode gerar uma segunda chamada paga; só é permitido por flag explícita.
  const modalityTries: Modality[][] = allowModalityRetry
    ? [[Modality.IMAGE], [Modality.TEXT, Modality.IMAGE]]
    : [[Modality.IMAGE]];
  let lastErr: unknown = new Error("nenhuma tentativa executada");
  for (const responseModalities of modalityTries) {
    try {
      const res = await ai.models.generateContent({ model, contents, config: { responseModalities } });
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        const d = p.inlineData?.data;
        if (d && (p.inlineData?.mimeType ?? "").startsWith("image/")) return d;
      }
      const txt = res.text;
      if (txt) fail(`O modelo respondeu texto em vez de imagem (recusa ou prompt inviável):\n${txt}`);
      lastErr = new Error("resposta sem parte de imagem");
    } catch (err) {
      lastErr = err;
      if (/modal/i.test(errMsg(err))) continue; // problema de modalidade → tenta a próxima combinação
      break;
    }
  }
  return fail(`Não consegui gerar a imagem: ${errMsg(lastErr)}`);
}

async function main(): Promise<void> {
  const o = parseArgs(process.argv.slice(2));
  validateModeCompatibility(o);
  const { value: apiKey, source: apiKeySource } = resolveApiKey();
  const model = o.model ?? (o.pro ? MODEL_PRO : MODEL_FLASH);

  if (o.listModels) {
    if (!apiKey) {
      fail("Nenhuma credencial Gemini encontrada. Aceita GOOGLE_API_KEY, GEMINI_API_KEY ou GOOGLE_GEMINI_API_KEY.");
    }
    const ai = new GoogleGenAI({ apiKey });
    console.log("Modelos disponíveis para sua key (procure os que terminam em -image):\n");
    try {
      for await (const m of await ai.models.list()) {
        const name = (m.name ?? "").replace(/^models\//, "");
        console.log(`  ${name}${m.displayName ? `  — ${m.displayName}` : ""}`);
      }
    } catch (err) {
      fail(`Falha ao listar modelos (key inválida ou sem acesso?): ${errMsg(err)}`);
    }
    return;
  }

  const prompt = await resolvePrompt(o);
  const out = resolveOut(o);
  assertOutputWritable(out, o.force);
  if (o.attachFrontmatter && !o.post) {
    fail("--attach-frontmatter exige --post <dir>.");
  }
  const frontmatterPlan = o.attachFrontmatter && o.post ? await planCoverFrontmatter(o.post, out) : [];

  if (o.dryRun) {
    console.log("· dry-run (nenhuma chamada à API ou escrita)");
    console.log("· modelo:", model);
    console.log("· saída :", `${out} (${o.size.width}x${o.size.height} webp)`);
    console.log("· refs  :", o.refs.length ? o.refs.join(", ") : "(nenhuma)");
    console.log("· key   :", apiKey ? `presente (${apiKeySource})` : "AUSENTE (nenhum alias configurado)");
    console.log("· overwrite:", o.force ? "permitido por --force" : "não aplicável");
    console.log("· retry de modalidade:", o.allowModalityRetry ? "permitido" : "bloqueado (uma chamada paga)");
    console.log(
      "· frontmatter:",
      o.attachFrontmatter ? `validado; ${frontmatterPlan.length} arquivo(s) serão atualizados após gerar` : "sem alteração",
    );
    console.log(`\n--- prompt ---\n${prompt}\n`);
    return;
  }

  if (!apiKey) {
    fail(
      "Nenhuma credencial Gemini encontrada. Aceita GOOGLE_API_KEY, GEMINI_API_KEY ou GOOGLE_GEMINI_API_KEY.\n" +
        "  Configure uma delas no ambiente local de autoria (.env ou .env.development.local).\n" +
        "  Nunca adicione a chave à Vercel: só a capa gerada entra no Git.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = await buildContents(prompt, o.refs);

  console.log(`· gerando com ${model} …`);
  const b64 = await generateImage(ai, model, contents, o.allowModalityRetry);

  const webp = await sharp(Buffer.from(b64, "base64"))
    .resize(o.size.width, o.size.height, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, webp);
  await applyCoverFrontmatter(frontmatterPlan);

  console.log(`✓ capa gravada: ${out} (${o.size.width}x${o.size.height}, ${(webp.length / 1024).toFixed(0)} KB)`);
  console.log("  revise a imagem; se não curtir, ajuste o prompt e rode de novo.");
}

// Vitest pode apontar process.argv[1] para o módulo sob teste. Só executa quando
// o arquivo foi chamado diretamente como a CLI, não quando foi importado.
const directCliInvocation = /(?:^|[\\/])gen-cover\.ts$/.test(process.argv[1] ?? "");
if (directCliInvocation && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]!)) {
  main().catch((e: unknown) => fail(errMsg(e)));
}
