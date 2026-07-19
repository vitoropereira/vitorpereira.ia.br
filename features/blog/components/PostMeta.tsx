import { getLocale, getTranslations } from "next-intl/server";
import type { Post } from "../types";

export async function PostMeta({ post }: { post: Post }) {
  const locale = await getLocale();
  const t = await getTranslations("blog");
  const date = new Date(post.date).toLocaleDateString(
    locale === "pt" ? "pt-BR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const tagBase = locale === "pt" ? "/tags" : "/en/tags";

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
      <em>{date}</em>
      <span>·</span>
      <span>{t("readingTime", { minutes: post.readingTime })}</span>
      {post.tags && post.tags.length > 0 && (
        <>
          <span>·</span>
          <ul className="flex gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <a
                  href={`${tagBase}/${encodeURIComponent(tag)}`}
                  className="hover:text-foreground"
                >
                  #{tag}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {post.tabnews && (
        <>
          <span>·</span>
          <a
            href={post.tabnews}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Discuta no TabNews
          </a>
        </>
      )}
    </div>
  );
}
