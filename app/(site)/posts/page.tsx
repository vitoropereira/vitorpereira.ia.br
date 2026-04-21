import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import { Pagination } from "@/features/blog/components/Pagination";
import { PostList } from "@/features/blog/components/PostList";
import { siteConfig } from "@/lib/siteConfig";
import { buildMetadata } from "@/components/seo/buildMetadata";

export const metadata: Metadata = buildMetadata({
  title: "Posts",
  description:
    "Artigos sobre desenvolvimento, IA, SaaS e produto — escritos por Vitor Pereira.",
  path: "/posts",
  locale: "pt",
  alternatePath: "/en/posts",
  type: "website",
});

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const current = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const posts = getPostsByLocale("pt");
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
      <Pagination current={current} total={total} basePath="/posts" />
    </section>
  );
}
