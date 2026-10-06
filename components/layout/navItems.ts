import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { NavItem } from "./NavLinks";

// Só dados planos: estes itens cruzam a fronteira server→client (RSC), que não
// serializa RegExp. Por isso os padrões são strings, compiladas no NavLinks.
export function buildNavItems(
  locale: "pt" | "en",
  t: (key: "posts" | "portfolio" | "about" | "contact") => string,
): NavItem[] {
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale];
  return [
    {
      href: r("postsList"),
      label: t("posts"),
      matchPatterns: ["^/(en/)?\\d{4}/\\d{2}/\\d{2}/", "^/(en/)?tags/"],
    },
    { href: r("portfolio"), label: t("portfolio") },
    { href: r("about"), label: t("about") },
    { href: r("contact"), label: t("contact") },
  ];
}
