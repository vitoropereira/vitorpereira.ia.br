import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";

export function MdxPage({
  title,
  description,
  body,
  image,
  justify,
}: {
  title: string;
  description?: string;
  body: string;
  image?: { src: string; alt: string };
  justify?: boolean;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {image && (
        <Image
          src={image.src}
          alt={image.alt}
          width={512}
          height={435}
          priority
          className="mx-auto mb-6 h-auto w-44 drop-shadow-lg sm:float-right sm:mb-3 sm:ml-8 sm:w-60 md:w-72"
        />
      )}
      <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground mb-8">{description}</p>
      )}
      <article
        className={`prose-post${justify ? " hyphens-auto text-justify" : ""}`}
      >
        <MDXRemote
          source={body}
          components={mdxComponents}
          options={{ mdxOptions }}
        />
      </article>
    </section>
  );
}
