import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByLocale } from "@/features/blog/lib/queries";
import { PostBody } from "@/features/blog/components/PostBody";
import { PostMeta } from "@/features/blog/components/PostMeta";
import { PostToc } from "@/features/blog/components/PostToc";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";
import { GiscusComments } from "@/features/blog/components/GiscusComments";
import { DraftBadge } from "@/features/blog/components/DraftBadge";
import { extractToc } from "@/features/blog/lib/toc";

export async function generateStaticParams() {
  const posts = getPostsByLocale("pt", { includeDrafts: false });
  return posts.map((p) => {
    const [year, month, day, slug] = p.permalink.split("/").filter(Boolean);
    return { year, month, day, slug };
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

  return (
    <div className="mx-auto flex max-w-[88rem] gap-8 px-6 py-12 lg:grid lg:grid-cols-[1fr_220px]">
      <article className="mx-auto w-full max-w-6xl">
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
