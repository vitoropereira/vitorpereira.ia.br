/**
 * gen-card-assets — gera os artefatos estáticos do cartão de visita (/card).
 *
 * Produz três coisas, todas commitadas no repo:
 *   public/card/qr-card.svg          QR vetorial (imprime em qualquer tamanho)
 *   public/card/qr-card.png          QR 1024px (crachá, adesivo, slide)
 *   lib/card/photo.generated.ts      foto em base64 embutida no vCard
 *
 * Por que pré-gerar em vez de fazer em runtime: o QR e a foto nunca mudam entre
 * deploys. Gerar aqui mantém a rota do vCard sem dependência de imagem e o
 * build sem processamento de imagem.
 *
 * Uso:
 *   pnpm gen:card-assets
 *   pnpm gen:card-assets --url https://vitorpereira.ia.br/card
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// public/static/ é território do Velite (output.clean: true) e está no
// .gitignore — os assets do cartão precisam morar fora de lá para serem
// commitados e sobreviverem ao build.
const ASSET_DIR = path.join(ROOT, "public", "card");
const SOURCE_PHOTO = path.join(ROOT, "public", "vitor.png");
const PHOTO_MODULE = path.join(ROOT, "lib", "card", "photo.generated.ts");

const DEFAULT_URL = "https://vitorpereira.ia.br/card?ref=qr";

/** Lado do PNG. 1024px imprime nítido até ~8cm a 300dpi. */
const PNG_SIZE = 1024;
/** Lado da foto no vCard. Agenda mostra pequeno; 320px já é generoso. */
const PHOTO_SIZE = 320;

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * Correção de erro alta (H): o QR continua legível com ~30% da área danificada.
 * Importa porque crachá amassa, adesivo descasca e celular lê torto.
 */
const QR_OPTIONS = { errorCorrectionLevel: "H", margin: 2 } as const;

async function generateQr(url: string): Promise<void> {
  mkdirSync(ASSET_DIR, { recursive: true });

  const svg = await QRCode.toString(url, {
    ...QR_OPTIONS,
    type: "svg",
    color: { dark: "#0B1220", light: "#FFFFFF" },
  });
  writeFileSync(path.join(ASSET_DIR, "qr-card.svg"), svg, "utf8");

  await QRCode.toFile(path.join(ASSET_DIR, "qr-card.png"), url, {
    ...QR_OPTIONS,
    type: "png",
    width: PNG_SIZE,
    color: { dark: "#0B1220", light: "#FFFFFF" },
  });

  console.log(`✔ QR gerado para ${url}`);
}

async function generatePhotoModule(): Promise<void> {
  const buffer = await sharp(SOURCE_PHOTO)
    .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover", position: "top" })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  const base64 = buffer.toString("base64");
  const contents = `/**
 * GERADO POR scripts/gen-card-assets.ts — NÃO EDITAR À MÃO.
 * Foto do vCard (${PHOTO_SIZE}x${PHOTO_SIZE} JPEG, ${(buffer.length / 1024).toFixed(1)} KB).
 * Regenerar: pnpm gen:card-assets
 */
export const cardPhotoBase64 =
  "${base64}";

export const cardPhotoMediaType = "JPEG";
`;
  writeFileSync(PHOTO_MODULE, contents, "utf8");
  console.log(`✔ Foto do vCard: ${(buffer.length / 1024).toFixed(1)} KB`);
}

async function main(): Promise<void> {
  const url = argValue("--url") ?? DEFAULT_URL;
  await generateQr(url);
  await generatePhotoModule();
  console.log("\nPronto. Revise os arquivos e commite.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
