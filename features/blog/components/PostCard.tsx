import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Post } from "../types";
import { DraftBadge } from "./DraftBadge";

export async function PostCard({ post }: { post: Post }) {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const date = new Date(post.date).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const cover =
    post.cover && typeof post.cover === "object" && "src" in post.cover
      ? (post.cover as { src: string; width: number; height: number })
      : null;

  return (
    <article className="group grid gap-4 border-b py-6 md:grid-cols-[180px_1fr]">
      {cover ? (
        <Link href={post.permalink}>
          <Image
            src={cover.src}
            alt=""
            width={cover.width}
            height={cover.height}
            className="aspect-[3/2] rounded object-cover"
          />
        </Link>
      ) : (
        <div className="hidden md:block" />
      )}
      <div className="flex flex-col">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <time>{date}</time>
          <span>·</span>
          <span>{t("readingTime", { minutes: post.readingTime })}</span>
          {post.draft && (
            <>
              <span>·</span>
              <DraftBadge />
            </>
          )}
        </div>
        <h2 className="mt-2 font-serif text-2xl leading-tight font-bold">
          <Link href={post.permalink} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{post.excerpt}</p>
        {post.tags && post.tags.length > 0 && (
          <ul className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
            {post.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="bg-muted rounded px-2 py-0.5">
                #{tag}
              </li>
            ))}
            {post.tags.length > 3 && (
              <li className="bg-muted rounded px-2 py-0.5">
                +{post.tags.length - 3}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
