import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { Pagination } from "@/features/blog/components/Pagination";
import {
  TagChips,
  shouldFeatureFirst,
  rankTagsByFrequency,
} from "@/features/blog/components/TagChips";
import { PostList } from "@/features/blog/components/PostList";
import { siteConfig } from "@/lib/siteConfig";
import { buildMetadata } from "@/components/seo/buildMetadata";

export const metadata: Metadata = buildMetadata({
  title: "Posts",
  description:
    "Articles on development, AI, SaaS, and product — by Vitor Pereira.",
  path: "/en/posts",
  locale: "en",
  alternatePath: "/posts",
  type: "website",
});

export default async function PostsPageEn({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const current = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const posts = getPostsByLocale("en");
  const total = Math.max(1, Math.ceil(posts.length / siteConfig.postsPerPage));
  const offset = (current - 1) * siteConfig.postsPerPage;
  const pageItems = posts.slice(offset, offset + siteConfig.postsPerPage);
  const t = await getTranslations("nav");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        {t("posts")}
      </h1>
      <p className="text-muted-foreground mt-3 mb-8 max-w-2xl text-lg">
        Agents, automation, and AI in production — what works, what breaks, and
        why.
      </p>
      <TagChips tags={rankTagsByFrequency(posts)} locale="en" />
      <PostList posts={pageItems} featuredFirst={shouldFeatureFirst(current)} />
      <Pagination current={current} total={total} basePath="/en/posts" />
    </section>
  );
}
