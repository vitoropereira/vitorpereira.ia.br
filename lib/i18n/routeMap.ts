export const institutionalRoutes: Record<string, { pt: string; en: string }> = {
  home: { pt: "/", en: "/en" },
  about: { pt: "/sobre", en: "/en/about" },
  portfolio: { pt: "/portfolio", en: "/en/portfolio" },
  contact: { pt: "/contato", en: "/en/contact" },
  privacy: { pt: "/privacidade", en: "/en/privacy" },
  terms: { pt: "/termos", en: "/en/terms" },
  postsList: { pt: "/posts", en: "/en/posts" },
};

export function swapLocale(path: string, target: "pt" | "en"): string {
  for (const entry of Object.values(institutionalRoutes)) {
    if (entry.pt === path) return entry.en;
    if (entry.en === path) return entry.pt;
  }
  // Posts share slug between locales: /YYYY/MM/DD/slug  <->  /en/YYYY/MM/DD/slug
  if (target === "en" && !path.startsWith("/en")) return `/en${path}`;
  if (target === "pt" && path.startsWith("/en/"))
    return path.replace(/^\/en/, "");
  if (target === "pt" && path === "/en") return "/";
  return path;
}
