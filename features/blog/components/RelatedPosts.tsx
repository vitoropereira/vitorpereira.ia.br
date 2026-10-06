import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { getRelatedPosts } from "../lib/queries";
import { posts as rawPosts } from "@/content";
import type { Post } from "../types";
import { PostCard } from "./PostCard";

export async function RelatedPosts({ post }: { post: Post }) {
  const all = rawPosts as unknown as Post[];
  const related = getRelatedPosts(post, all, 3);
  if (related.length === 0) return null;
  const t = await getTranslations("blog");
  const locale = (await getLocale()) === "pt" ? "pt" : "en";

  return (
    <section className="mt-16 border-t pt-8">
      <h2 className="mb-6 font-sans text-lg font-semibold">
        {t("relatedPosts")}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((rp, i) => (
          <Reveal key={rp.permalink} delay={(i % 3) * 80}>
            <PostCard
              post={rp}
              locale={locale}
              readingTimeLabel={t("readingTime", { minutes: rp.readingTime })}
              showTags={false}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
