const CALLOUT_LABEL: Record<string, string> = { note: "Nota", warn: "Atenção", info: "Info" };

/** `<Callout type="x">...</Callout>` → `> **Label:** ...` (uma linha). */
export function calloutsToBlockquotes(md: string): string {
  return md.replace(
    /<Callout\s+type=["'](note|warn|info)["']\s*>([\s\S]*?)<\/Callout>/g,
    (_m, type: string, inner: string) => `> **${CALLOUT_LABEL[type] ?? "Nota"}:** ${inner.replace(/\s+/g, " ").trim()}`,
  );
}

/** `<Video id="X" />` → link do YouTube. */
export function videosToLinks(md: string): string {
  return md.replace(
    /<Video\s+id=["']([^"']+)["'][^>]*\/?>(?:<\/Video>)?/g,
    (_m, id: string) => `[Assista no YouTube](https://youtu.be/${id})`,
  );
}

/** Links markdown que começam com `/` viram absolutos. */
export function absolutizeInternalLinks(md: string, base: string): string {
  return md.replace(/\]\((\/[^)]*)\)/g, (_m, path: string) => `](${base}${path})`);
}
