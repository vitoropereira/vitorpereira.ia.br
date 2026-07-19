import type { SyndicationFormat } from "../mdx/to-tabnews-markdown.ts";

export interface SourcePost {
  title: string;
  body: string;
  canonicalUrl: string;
  permalink: string;
  locale: "pt" | "en";
  draft: boolean;
  tags: string[];
}
export interface TabNewsContent {
  title: string;
  body: string;
  sourceUrl: string;
  status: "published" | "draft";
}
export interface SyndicationResult {
  target: "tabnews";
  url: string;
  externalSlug: string;
  format: SyndicationFormat;
}
