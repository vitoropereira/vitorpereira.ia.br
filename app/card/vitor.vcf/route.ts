import { buildVCard } from "@/lib/card/vcard";
import { cardContact, cardIdentity } from "@/lib/card/config";
import { vCardUrls } from "@/lib/card/links";
import {
  cardPhotoBase64,
  cardPhotoMediaType,
} from "@/lib/card/photo.generated";

// Conteúdo idêntico entre requests — gerado no build, servido do CDN.
export const dynamic = "force-static";

/**
 * GET /card/vitor.vcf — vCard 3.0 do cartão de visita.
 *
 * Content-Disposition é `inline`, não `attachment`: no iOS o `inline` com
 * text/vcard abre direto a tela "Adicionar aos contatos", enquanto `attachment`
 * joga o arquivo em Downloads e cobra um toque a mais. O nome do arquivo já vem
 * do próprio caminho da rota (vitor.vcf).
 */
export function GET(): Response {
  const vcard = buildVCard({
    identity: cardIdentity,
    contact: cardContact,
    urls: vCardUrls(),
    photo: { base64: cardPhotoBase64, mediaType: cardPhotoMediaType },
    revision: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  });

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'inline; filename="vitor-onofre-pereira.vcf"',
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
