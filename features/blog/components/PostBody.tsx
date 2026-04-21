import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";
import type { Post } from "../types";

export function PostBody({ post }: { post: Post }) {
  return (
    <article className="prose-post">
      <MDXRemote
        source={post.body}
        components={mdxComponents}
        options={{ mdxOptions }}
      />
    </article>
  );
}
