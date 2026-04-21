import { posts } from "@/content";

export type Post = (typeof posts)[number];
export type Locale = Post["locale"];
