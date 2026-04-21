import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";

export function MdxPage({
  title,
  description,
  body,
}: {
  title: string;
  description?: string;
  body: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground mb-8">{description}</p>
      )}
      <article className="prose-post">
        <MDXRemote
          source={body}
          components={mdxComponents}
          options={{ mdxOptions }}
        />
      </article>
    </section>
  );
}
