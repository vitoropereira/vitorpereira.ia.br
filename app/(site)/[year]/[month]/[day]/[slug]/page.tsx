import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostBody } from "@/features/blog/components/PostBody";
import { PostMeta } from "@/features/blog/components/PostMeta";
import { PostToc } from "@/features/blog/components/PostToc";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";
import { GiscusComments } from "@/features/blog/components/GiscusComments";
import { DraftBadge } from "@/features/blog/components/DraftBadge";
import { coverOf } from "@/features/blog/lib/cover";
import { ReadingProgress } from "@/features/blog/components/ReadingProgress";
import { extractToc } from "@/features/blog/lib/toc";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteConfig";

// Posts agendados (data futura) ficam fora do generateStaticParams, então caem
// no dynamicParams e são renderizados em request time. O revalidate existe pra
// que o 404 cacheado de um agendado expire — senão ele seguiria 404 depois da
// data, até o próximo deploy.
export const revalidate = 600;

export async function generateStaticParams() {
  const posts = getPostsByLocale("pt", { preview: false });
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
  const cover = coverOf(post);
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
  const cover = coverOf(post);

  return (
    <>
      <ReadingProgress locale="pt" />
      <div
        className={cn(
          "mx-auto grid max-w-6xl gap-10 px-6 py-12",
          toc.length > 0 && "lg:grid-cols-[minmax(0,1fr)_220px]",
        )}
      >
        <article className="min-w-0">
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
          {cover && (
            <Image
              src={cover.src}
              alt=""
              width={cover.width}
              height={cover.height}
              priority
              placeholder={cover.blurDataURL ? "blur" : undefined}
              blurDataURL={cover.blurDataURL}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="mx-auto mb-10 aspect-video w-full max-w-4xl rounded-xl object-cover"
            />
          )}
          <header className="mx-auto max-w-4xl text-center">
            {post.draft && (
              <div className="mb-2">
                <DraftBadge />
              </div>
            )}
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
              {post.title}
            </h1>
            <div className="mt-4">
              <PostMeta post={post} />
            </div>
          </header>
          <div className="bg-border mx-auto my-12 h-px max-w-4xl" />
          {/* Coluna de leitura de 70ch: linha mais longa cansa o olho. */}
          <div className="mx-auto max-w-[70ch]">
            <PostBody post={post} />
            <RelatedPosts post={post} />
            {post.comments && <GiscusComments />}
          </div>
        </article>
        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <PostToc items={toc} locale="pt" />
          </aside>
        )}
      </div>
    </>
  );
}
