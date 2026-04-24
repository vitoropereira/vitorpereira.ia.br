import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostBody } from "@/features/blog/components/PostBody";
import { PostMeta } from "@/features/blog/components/PostMeta";
import { PostToc } from "@/features/blog/components/PostToc";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";
import { GiscusComments } from "@/features/blog/components/GiscusComments";
import { DraftBadge } from "@/features/blog/components/DraftBadge";
import { extractToc } from "@/features/blog/lib/toc";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/siteConfig";

export async function generateStaticParams() {
  const posts = getPostsByLocale("pt", { includeDrafts: false });
  return posts.map((p) => {
    const [year, month, day, slug] = p.permalink.split("/").filter(Boolean);
    return { year, month, day, slug };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug("pt", slug);
  if (!post) return {};
  const cover =
    post.cover && typeof post.cover === "object" && "src" in post.cover
      ? (post.cover as { src: string; width: number; height: number })
      : null;
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: post.permalink,
    locale: "pt",
    alternatePath: post.translationSlug ?? undefined,
    type: "article",
    noIndex: post.draft,
    images: cover
      ? [
          {
            url: `${siteConfig.url}${cover.src}`,
            width: cover.width,
            height: cover.height,
            alt: post.title,
          },
        ]
      : undefined,
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug("pt", slug);
  if (!post) notFound();
  const toc = extractToc(post.body);
  const cover =
    post.cover && typeof post.cover === "object" && "src" in post.cover
      ? (post.cover as { src: string })
      : null;

  return (
    <div className="mx-auto flex max-w-[88rem] gap-8 px-6 py-12 lg:grid lg:grid-cols-[1fr_220px]">
      <article className="mx-auto w-full max-w-6xl">
        <JsonLd
          data={{
            type: "BlogPosting",
            title: post.title,
            description: post.description,
            url: `${siteConfig.url}${post.permalink}`,
            datePublished: new Date(post.date).toISOString(),
            dateModified: post.updated
              ? new Date(post.updated).toISOString()
              : new Date(post.date).toISOString(),
            tags: post.tags,
            locale: post.locale,
            image: cover
              ? `${siteConfig.url}${cover.src}`
              : `${siteConfig.url}/opengraph-image`,
          }}
        />
        <header className="text-center">
          {post.draft && (
            <div className="mb-2">
              <DraftBadge />
            </div>
          )}
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4">
            <PostMeta post={post} />
          </div>
        </header>
        <div className="bg-border my-12 h-px" />
        <PostBody post={post} />
        <RelatedPosts post={post} />
        {post.comments && <GiscusComments />}
      </article>
      <aside className="hidden lg:block">
        <PostToc items={toc} />
      </aside>
    </div>
  );
}
