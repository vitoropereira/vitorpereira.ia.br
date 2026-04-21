import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRelatedPosts } from "../lib/queries";
import { posts as rawPosts } from "@/content";
import type { Post } from "../types";

export async function RelatedPosts({ post }: { post: Post }) {
  const all = rawPosts as unknown as Post[];
  const related = getRelatedPosts(post, all, 3);
  if (related.length === 0) return null;
  const t = await getTranslations("blog");

  return (
    <section className="mt-16 border-t pt-8">
      <h2 className="mb-4 font-sans text-lg font-semibold">
        {t("relatedPosts")}
      </h2>
      <ul className="space-y-2">
        {related.map((rp) => (
          <li key={rp.permalink}>
            <Link href={rp.permalink} className="text-primary hover:underline">
              {rp.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
