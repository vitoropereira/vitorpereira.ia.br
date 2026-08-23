import { renderOgImage, OG_SIZE } from "@/components/seo/ogImage";

export const runtime = "edge";
export const alt = "Vitor Pereira — contato";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Preview do /card quando o link é compartilhado em DM. */
export default function Image() {
  return renderOgImage("pt", {
    statement: "Salve meu contato, chame no WhatsApp ou escolha a sua rede.",
  });
}
