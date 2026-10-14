import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    (process.env.VERCEL_ENV === undefined &&
      process.env.NODE_ENV === "production");

  if (!isProduction) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${siteConfig.url}/sitemap.xml`,
    };
  }

  return {
    // /admin também leva noindex no layout; o disallow evita até o rastreio.
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
