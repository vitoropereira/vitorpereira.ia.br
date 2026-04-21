import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

type MDXOptions = NonNullable<
  NonNullable<MDXRemoteProps["options"]>["mdxOptions"]
>;

export const mdxOptions: MDXOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypePrettyCode,
      {
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      },
    ],
    [
      rehypeAutolinkHeadings,
      {
        behavior: "append",
        properties: {
          className: ["heading-anchor"],
          ariaLabel: "Link for this section",
        },
      },
    ],
  ],
};
