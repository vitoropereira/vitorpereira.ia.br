"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { SocialLinks } from "./SocialLinks";
import { bookingRoutes } from "@/features/booking/routes";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";

const linkClass =
  "hover:text-foreground focus-visible:ring-ring rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

export function Footer() {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  const pt = locale === "pt";

  const navItems = [
    { href: institutionalRoutes.postsList[locale], label: "Blog" },
    {
      href: institutionalRoutes.portfolio[locale],
      label: pt ? "Portfólio" : "Portfolio",
    },
    {
      href: institutionalRoutes.operationalAgent[locale],
      label: pt ? "Agente Operacional" : "Operational Agent",
    },
    { href: institutionalRoutes.about[locale], label: pt ? "Sobre" : "About" },
    {
      href: institutionalRoutes.contact[locale],
      label: pt ? "Contato" : "Contact",
    },
  ];

  const navTitle = pt ? "Navegação" : "Navigation";
  const contactTitle = pt ? "Contato" : "Contact";

  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl px-6 py-12 text-sm">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link href={institutionalRoutes.home[locale]} className="w-fit">
              <Logo variant="wordmark" />
            </Link>
            {/* Tagline curta: o statement longo já vive na home. */}
            <p className="max-w-xs">{siteConfig.tagline[locale]}</p>
          </div>

          {/* Títulos são <p>, não <h2>: não poluem o outline da página. */}
          <nav aria-labelledby="footer-nav-title">
            <p
              id="footer-nav-title"
              className="text-foreground mb-3 font-semibold"
            >
              {navTitle}
            </p>
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div role="group" aria-labelledby="footer-contact-title">
            <p
              id="footer-contact-title"
              className="text-foreground mb-3 font-semibold"
            >
              {contactTitle}
            </p>
            <div className="flex flex-col items-start gap-4">
              <Link href={bookingRoutes.diagnostic(locale)} className={linkClass}>
                {pt ? "Agendar diagnóstico" : "Book a diagnostic"}
              </Link>
              <SocialLinks />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <span>{t("copyright", { year })}</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={institutionalRoutes.privacy[locale]}
              className={linkClass}
            >
              {pt ? "Privacidade" : "Privacy"}
            </Link>
            <Link href={institutionalRoutes.terms[locale]} className={linkClass}>
              {pt ? "Termos" : "Terms"}
            </Link>
            <button
              type="button"
              className={linkClass}
              onClick={() =>
                window.dispatchEvent(new CustomEvent("consent:reopen"))
              }
            >
              {t("manageCookies")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
