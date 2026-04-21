import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale as "pt" | "en"];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href={r("home")} className="font-serif text-lg font-bold">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href={r("postsList")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("posts")}
          </Link>
          <Link
            href={r("portfolio")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("portfolio")}
          </Link>
          <Link
            href={r("about")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("about")}
          </Link>
          <Link
            href={r("contact")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("contact")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
