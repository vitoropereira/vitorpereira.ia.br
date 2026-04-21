import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostList } from "@/features/blog/components/PostList";
import { posts as rawPosts } from "@/content";
import type { Post } from "@/features/blog/types";
import { buildMetadata } from "@/components/seo/buildMetadata";

export async function generateStaticParams() {
  const tags = getAllTags(rawPosts as unknown as Post[], "en");
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const encoded = encodeURIComponent(tag);
  return buildMetadata({
    title: `#${tag}`,
    description: `Posts tagged #${tag} — by Vitor Pereira.`,
    path: `/en/tags/${encoded}`,
    locale: "en",
    alternatePath: `/tags/${encoded}`,
    type: "website",
  });
}

export default async function TagPageEn({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = getPostsByLocale("en", { tag });
  if (posts.length === 0) notFound();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight">
        Posts tagged <span className="text-primary">#{tag}</span>
      </h1>
      <PostList posts={posts} />
    </section>
  );
}
