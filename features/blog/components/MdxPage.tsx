import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";

export function MdxPage({
  title,
  description,
  body,
  image,
}: {
  title: string;
  description?: string;
  body: string;
  image?: { src: string; alt: string };
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {image && (
        <Image
          src={image.src}
          alt={image.alt}
          width={352}
          height={299}
          priority
          className="mx-auto mb-8 h-auto w-40 drop-shadow-lg"
        />
      )}
      <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight">
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
