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
 *   --list-models      valida a key e lista os modelos disponíveis, e sai
 *   --dry-run          não chama a API; mostra o plano e o prompt (não precisa de key)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { GoogleGenAI, Modality, type Content, type Part } from "@google/genai";
import sharp from "sharp";

// Model IDs do "Nano Banana". Podem mudar/rotacionar — rode `--list-models` pra
// ver os disponíveis na sua key e use `--model <id>` se algum ID mudar.
const MODEL_FLASH = "gemini-3.1-flash-image";
const MODEL_PRO = "gemini-3-pro-image";
const DEFAULT_SIZE = { width: 1672, height: 941 } as const;

interface Options {
  prompt?: string;
  promptFile?: string;
  post?: string;
  out?: string;
  refs: string[];
  model?: string;
  pro: boolean;
  size: { width: number; height: number };
  listModels: boolean;
  dryRun: boolean;
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
      "               [--list-models] [--dry-run]",
  );
}

function parseArgs(argv: string[]): Options {
  const o: Options = {
    refs: [],
    pro: false,
    size: { ...DEFAULT_SIZE },
    listModels: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) break;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) fail(`Faltou valor para ${a}`);
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
        break;
      }
      case "--list-models":
        o.listModels = true;
        break;
      case "--dry-run":
        o.dryRun = true;
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

async function generateImage(ai: GoogleGenAI, model: string, contents: Content[]): Promise<string> {
  // Alguns modelos aceitam só [IMAGE]; outros exigem [TEXT, IMAGE]. Tenta na ordem.
  const modalityTries: Modality[][] = [[Modality.IMAGE], [Modality.TEXT, Modality.IMAGE]];
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
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const model = o.model ?? (o.pro ? MODEL_PRO : MODEL_FLASH);

  if (o.dryRun) {
    const prompt = await resolvePrompt(o);
    const out = resolveOut(o);
    console.log("· dry-run (nenhuma chamada à API)");
    console.log("· modelo:", model);
    console.log("· saída :", `${out} (${o.size.width}x${o.size.height} webp)`);
    console.log("· refs  :", o.refs.length ? o.refs.join(", ") : "(nenhuma)");
    console.log("· key   :", apiKey ? "presente" : "AUSENTE (defina GOOGLE_API_KEY antes do run real)");
    console.log(`\n--- prompt ---\n${prompt}\n`);
    return;
  }

  if (!apiKey) {
    fail(
      "GOOGLE_API_KEY não definido.\n" +
        "  1. Pegue uma key em https://aistudio.google.com/apikey\n" +
        "  2. Cole em .env.development.local  →  GOOGLE_API_KEY=...\n" +
        "  3. Rode de novo.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  if (o.listModels) {
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
  const contents = await buildContents(prompt, o.refs);

  console.log(`· gerando com ${model} …`);
  const b64 = await generateImage(ai, model, contents);

  const webp = await sharp(Buffer.from(b64, "base64"))
    .resize(o.size.width, o.size.height, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, webp);

  console.log(`✓ capa gravada: ${out} (${o.size.width}x${o.size.height}, ${(webp.length / 1024).toFixed(0)} KB)`);
  console.log("  revise a imagem; se não curtir, ajuste o prompt e rode de novo.");
}

main().catch((e: unknown) => fail(errMsg(e)));
