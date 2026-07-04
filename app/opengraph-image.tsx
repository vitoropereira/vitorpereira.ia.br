import { siteConfig } from "@/lib/siteConfig";
import { renderOgImage, OG_SIZE } from "@/components/seo/ogImage";

// Conventional /opengraph-image (PT, default locale). Locale-aware cards for
// EN pages come from app/og/route.tsx via buildMetadata.
export const runtime = "edge";
export const alt = siteConfig.name;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage("pt");
}
