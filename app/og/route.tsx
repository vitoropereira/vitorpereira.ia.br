import { renderOgImage } from "@/components/seo/ogImage";

// Stable, locale-aware OG endpoint: /og?locale=pt|en. Route handlers keep a
// clean URL (no content hash), so buildMetadata can reference it per locale —
// unlike the opengraph-image file convention, whose nested routes get a hash.
export const runtime = "edge";

export function GET(request: Request): Response {
  const locale =
    new URL(request.url).searchParams.get("locale") === "en" ? "en" : "pt";
  return renderOgImage(locale);
}
