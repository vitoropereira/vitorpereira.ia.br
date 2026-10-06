import Link from "next/link";
import Image from "next/image";
import type { Post } from "../types";
import { coverOf } from "../lib/cover";
import { DraftBadge } from "./DraftBadge";

type Props = {
  post: Post;
  variant?: "default" | "featured";
  locale: "pt" | "en";
  // Já resolvido pelo caller server (PostList/RelatedPosts). Manter o card
  // síncrono evita getTranslations aqui dentro e o deixa testável em jsdom.
  readingTimeLabel: string;
  showTags?: boolean;
};

export function PostCard({
  post,
  variant = "default",
  locale,
  readingTimeLabel,
  showTags = true,
}: Props) {
  const featured = variant === "featured";
  const date = new Date(post.date).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
  const cover = coverOf(post);
  const tags = post.tags ?? [];

  const coverClass = featured ? "md:w-3/5 md:shrink-0" : "";

  return (
    <article
      className={`card-interactive group flex h-full flex-col overflow-hidden rounded-lg border ${
        featured ? "md:flex-row" : ""
      }`}
    >
      {/* Capa é link só para o mouse/toque; o foco de teclado fica no título. */}
      <Link
        href={post.permalink}
        tabIndex={-1}
        aria-hidden="true"
        className={`block ${coverClass}`}
      >
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            width={cover.width}
            height={cover.height}
            sizes={
              featured
                ? "(min-width: 768px) 60vw, 100vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
            className={`aspect-[16/9] w-full object-cover ${
              featured ? "md:h-full" : ""
            }`}
          />
        ) : (
          <div
            className={`from-primary/15 text-muted-foreground flex aspect-[16/9] w-full items-end bg-gradient-to-br to-transparent p-4 font-mono text-xs ${
              featured ? "md:h-full" : ""
            }`}
          >
            {tags[0]}
          </div>
        )}
      </Link>
      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:p-8" : ""}`}>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <time dateTime={post.date}>{date}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTimeLabel}</span>
          {post.draft && (
            <>
              <span aria-hidden="true">·</span>
              <DraftBadge />
            </>
          )}
        </div>
        <h2
          className={`font-heading mt-2 leading-tight font-bold ${
            featured ? "text-2xl md:text-4xl" : "text-xl"
          }`}
        >
          <Link
            href={post.permalink}
            className="hover:text-primary focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
          {post.excerpt}
        </p>
        {showTags && tags.length > 0 && (
          <ul className="text-muted-foreground mt-auto flex flex-wrap gap-2 pt-4 text-xs">
            {tags.slice(0, 3).map((tag) => (
              <li key={tag} className="bg-muted rounded px-2 py-0.5">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
