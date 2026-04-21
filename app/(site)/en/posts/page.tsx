import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { Pagination } from "@/features/blog/components/Pagination";
import { PostList } from "@/features/blog/components/PostList";
import { siteConfig } from "@/lib/siteConfig";

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
      <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight">
        {t("posts")}
      </h1>
      <PostList posts={pageItems} />
      <Pagination current={current} total={total} basePath="/en/posts" />
    </section>
  );
}
