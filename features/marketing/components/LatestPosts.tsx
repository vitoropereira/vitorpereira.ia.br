import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { coverOf } from "@/features/blog/lib/cover";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { Locale } from "@/lib/i18n/config";

export function LatestPosts({ locale }: { locale: Locale }) {
  const posts = getPostsByLocale(locale, { limit: 5, preview: false });
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight">
          {locale === "pt" ? "Últimos posts" : "Latest posts"}
        </h2>
        <Link
          href={institutionalRoutes.postsList[locale]}
          className="text-primary text-sm hover:underline"
        >
          {locale === "pt" ? "Ver todos →" : "See all →"}
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => {
          const cover = coverOf(p);
          const featured = i === 0;
          return (
            <Reveal
              key={p.permalink}
              as="article"
              delay={i * 80}
              className={`card-interactive group overflow-hidden rounded-lg border ${
                featured ? "lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              <Link href={p.permalink} className="block h-full">
                <div className="relative aspect-[16/9] overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover.src}
                      alt=""
                      fill
                      sizes={
                        featured
                          ? "(min-width: 1024px) 66vw, (min-width: 640px) 50vw, 100vw"
                          : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      }
                      placeholder={cover.blurDataURL ? "blur" : "empty"}
                      blurDataURL={cover.blurDataURL}
                      className="object-cover"
                    />
                  ) : (
                    <div className="from-primary/15 h-full bg-gradient-to-br to-transparent" />
                  )}
                </div>
                <div className="p-4">
                  <time className="text-muted-foreground font-mono text-xs">
                    {new Date(p.date).toLocaleDateString(
                      locale === "pt" ? "pt-BR" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </time>
                  <h3
                    className={`font-heading mt-2 font-semibold ${
                      featured ? "text-xl" : ""
                    }`}
                  >
                    {p.title}
                  </h3>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
