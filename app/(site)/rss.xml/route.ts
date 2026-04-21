import { getPostsByLocale } from "@/features/blog/lib/queries";
import { siteConfig } from "@/lib/siteConfig";

export const dynamic = "force-static";

function escapeXml(text: string): string {
  return text.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c] as string,
  );
}

export async function GET() {
  const posts = getPostsByLocale("pt", { includeDrafts: false, limit: 20 });
  const items = posts
    .map((p) => {
      const url = `${siteConfig.url}${p.permalink}`;
      const date = new Date(p.date).toUTCString();
      const categories = (p.tags ?? [])
        .map((t) => `<category>${escapeXml(t)}</category>`)
        .join("\n      ");
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${p.excerpt}]]></description>
      <content:encoded><![CDATA[${p.body}]]></content:encoded>
      ${categories}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}/</link>
    <description>${escapeXml(siteConfig.tagline.pt)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
