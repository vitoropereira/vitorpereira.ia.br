import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { PostCard } from "./PostCard";
import type { Post } from "../types";

// Async: resolve locale e tradução uma vez e passa por props, para o PostCard
// continuar síncrono.
export async function PostList({
  posts,
  featuredFirst = false,
}: {
  posts: Post[];
  featuredFirst?: boolean;
}) {
  const locale = (await getLocale()) === "pt" ? "pt" : "en";
  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {locale === "pt" ? "Nenhum post ainda." : "No posts yet."}
      </p>
    );
  }
  const t = await getTranslations("blog");
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => {
        const featured = featuredFirst && i === 0;
        const card = (
          <PostCard
            post={p}
            variant={featured ? "featured" : "default"}
            locale={locale}
            readingTimeLabel={t("readingTime", { minutes: p.readingTime })}
            priority={featured}
          />
        );
        const span = featured ? "sm:col-span-2 lg:col-span-3" : undefined;
        // O destaque é candidato a LCP: Reveal deixa opacity 0 até a
        // hidratação, então ele renderiza num div simples.
        if (featured) {
          return (
            <div key={p.permalink} className={span}>
              {card}
            </div>
          );
        }
        return (
          <Reveal key={p.permalink} delay={(i % 3) * 80}>
            {card}
          </Reveal>
        );
      })}
    </div>
  );
}
