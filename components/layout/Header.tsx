import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ScrollAwareHeader } from "./ScrollAwareHeader";
import { Logo } from "@/components/brand/Logo";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale as "pt" | "en"];

  const items = [
    { href: r("postsList"), label: t("posts") },
    { href: r("portfolio"), label: t("portfolio") },
    { href: r("about"), label: t("about") },
    { href: r("contact"), label: t("contact") },
  ];

  return (
    <ScrollAwareHeader>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href={r("home")} aria-label={siteConfig.name}>
          <Logo variant="wordmark" />
        </Link>
        <nav className="hidden md:flex">
          <NavLinks items={items} />
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LangToggle />
          <ThemeToggle />
        </div>
        <div className="md:hidden">
          <MobileNav
            items={items}
            label={t("openMenu")}
            closeLabel={t("closeMenu")}
            title={t("menu")}
          />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
