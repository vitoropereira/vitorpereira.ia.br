"use client";

import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { bookingRoutes } from "@/features/booking/routes";

type DiagnosticCTAProps = {
  locale: Locale;
  children: React.ReactNode;
};

/**
 * CTA editorial: navega sem JavaScript e mede a intenção de diagnóstico quando
 * o analytics está disponível. Não usa o redirect de syndication porque esta
 * origem é o próprio site, não TabNews.
 */
export function DiagnosticCTA({ locale, children }: DiagnosticCTAProps) {
  const source = usePathname();
  const target = bookingRoutes.diagnostic(locale);

  return (
    <a
      href={target}
      onClick={() =>
        track("diagnostic_cta_click", {
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
