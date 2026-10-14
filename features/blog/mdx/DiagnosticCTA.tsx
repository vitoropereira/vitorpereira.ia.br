"use client";

import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/gtag";
import type { Locale } from "@/lib/i18n/config";
import { bookingRoutes } from "@/features/booking/routes";

type DiagnosticCTAProps = {
  locale: Locale;
  children: React.ReactNode;
};

/**
 * CTA editorial: navega sem JavaScript e mede a intenção de diagnóstico no GA4,
 * só quando ele está carregado (ou seja, com consentimento). Não usa o redirect de syndication porque esta
 * origem é o próprio site, não TabNews.
 */
export function DiagnosticCTA({ locale, children }: DiagnosticCTAProps) {
  const source = usePathname();
  const target = bookingRoutes.diagnostic(locale);

  return (
    <a
      href={target}
      onClick={() =>
        trackEvent("diagnostic_cta_click", {
          source,
          locale,
          target,
        })
      }
    >
      {children}
    </a>
  );
}
