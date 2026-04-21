import Link from "next/link";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { Locale } from "@/lib/i18n/config";

export function LatestPosts({ locale }: { locale: Locale }) {
  const posts = getPostsByLocale(locale, { limit: 5, includeDrafts: false });
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-serif text-3xl font-bold tracking-tight">
          {locale === "pt" ? "Últimos posts" : "Latest posts"}
        </h2>
        <Link
          href={institutionalRoutes.postsList[locale]}
          className="text-primary text-sm hover:underline"
        >
          {locale === "pt" ? "Ver todos →" : "See all →"}
        </Link>
      </div>
      <ul className="divide-y rounded-lg border">
        {posts.map((p) => (
          <li key={p.permalink}>
            <Link
              href={p.permalink}
              className="hover:bg-accent flex items-baseline justify-between gap-4 p-4"
            >
              <span className="font-serif font-semibold">{p.title}</span>
              <time className="text-muted-foreground text-xs">
                {new Date(p.date).toLocaleDateString(
                  locale === "pt" ? "pt-BR" : "en-US",
                  { year: "numeric", month: "short", day: "numeric" },
                )}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
