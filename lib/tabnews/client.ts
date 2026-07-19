import { TABNEWS_API, TABNEWS_WEB } from "../syndication/config.ts";
import { TabNewsError, RateLimitError, AuthError } from "./errors.ts";

export { TabNewsError, RateLimitError, AuthError };

export interface TabNewsSession { token: string; expiresAt: string }
export interface CreateContentInput { title: string; body: string; status: "published" | "draft"; sourceUrl: string }
export interface CreatedContent { url: string; ownerUsername: string; slug: string }

type Deps = { fetch?: typeof fetch };

async function readError(res: Response): Promise<string> {
  try {
    return ((await res.json()) as { message?: string }).message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
function raise(status: number, message: string): never {
  if (status === 429) throw new RateLimitError(message);
  if (status === 401 || status === 403) throw new AuthError(message, status);
  throw new TabNewsError(message, status);
}

export async function createSession(creds: { email: string; password: string }, deps: Deps = {}): Promise<TabNewsSession> {
  const f = deps.fetch ?? fetch;
  const res = await f(`${TABNEWS_API}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) raise(res.status, await readError(res));
  const j = (await res.json()) as { token: string; expires_at: string };
  return { token: j.token, expiresAt: j.expires_at };
}

export interface ContentMetrics {
  tabcoins: number;
  comments: number;
}

/** Lê tabcoins + total de comentários de um conteúdo público (sem sessão). */
export async function getContentMetrics(
  owner: string,
  slug: string,
  deps: Deps = {},
): Promise<ContentMetrics> {
  const f = deps.fetch ?? fetch;
  const res = await f(`${TABNEWS_API}/contents/${owner}/${slug}`);
  if (!res.ok) raise(res.status, await readError(res));
  const j = (await res.json()) as { tabcoins?: number; children_deep_count?: number };
  return { tabcoins: j.tabcoins ?? 0, comments: j.children_deep_count ?? 0 };
}

export async function createContent(session: TabNewsSession, input: CreateContentInput, deps: Deps = {}): Promise<CreatedContent> {
  const f = deps.fetch ?? fetch;
  const res = await f(`${TABNEWS_API}/contents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `session_id=${session.token}` },
    body: JSON.stringify({ title: input.title, body: input.body, status: input.status, source_url: input.sourceUrl }),
  });
  if (!res.ok) raise(res.status, await readError(res));
  const j = (await res.json()) as { owner_username: string; slug: string };
  return { url: `${TABNEWS_WEB}/${j.owner_username}/${j.slug}`, ownerUsername: j.owner_username, slug: j.slug };
}
