"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { SocialLinks } from "./SocialLinks";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export function Footer() {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <span>{t("copyright", { year })}</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={institutionalRoutes.privacy[locale]}
            className="hover:text-foreground"
          >
            {locale === "pt" ? "Privacidade" : "Privacy"}
          </Link>
          <Link
            href={institutionalRoutes.terms[locale]}
            className="hover:text-foreground"
          >
            {locale === "pt" ? "Termos" : "Terms"}
          </Link>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("consent:reopen"))
            }
          >
            {t("manageCookies")}
          </button>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
