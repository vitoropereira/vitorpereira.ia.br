import { toTabNewsMarkdown, type SyndicationFormat } from "../mdx/to-tabnews-markdown.ts";
import {
  createSession as defaultCreateSession,
  createContent as defaultCreateContent,
} from "../tabnews/client.ts";
import type { SourcePost, TabNewsContent, SyndicationResult } from "./types.ts";

/** Puro: transforma o post no conteúdo a enviar. Não chama rede. */
export function buildTabNewsPreview(
  post: SourcePost,
  format: SyndicationFormat,
  status: "published" | "draft",
): TabNewsContent {
  const body = toTabNewsMarkdown({ body: post.body, title: post.title, canonicalUrl: post.canonicalUrl, format });
  return { title: post.title, body, sourceUrl: post.canonicalUrl, status };
}

type Deps = { createSession?: typeof defaultCreateSession; createContent?: typeof defaultCreateContent };

/** Rede: recebe o conteúdo FINAL (já possivelmente editado à mão) e publica. */
export async function publishToTabNews(
  content: TabNewsContent,
  format: SyndicationFormat,
  creds: { email: string; password: string },
  deps: Deps = {},
): Promise<SyndicationResult> {
  const createSession = deps.createSession ?? defaultCreateSession;
  const createContent = deps.createContent ?? defaultCreateContent;
  const session = await createSession(creds);
  const created = await createContent(session, content);
  return { target: "tabnews", url: created.url, externalSlug: created.slug, format };
}
