import { getBookingService } from "@/features/booking/services";
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

const { basePath, entrySlugs } = siteConfig.booking;

/**
 * Resolve a rota de um serviço agendável.
 *
 * Passa por `getBookingService` de propósito: se o slug sumir do catálogo, isto
 * estoura em teste/build em vez de gerar silenciosamente um link para 404 —
 * era o risco de manter as rotas escritas à mão no siteConfig.
 */
export function bookingRoute(slug: string, locale: Locale): string {
  if (!getBookingService(slug)) {
    throw new Error(
      `bookingRoute: "${slug}" não existe em bookingServices — CTA apontaria para 404.`,
    );
  }
  return `${basePath[locale]}/${slug}`;
}

export function bookingIndex(locale: Locale): string {
  return basePath[locale];
}

export const bookingRoutes = {
  index: bookingIndex,
  diagnostic: (locale: Locale) => bookingRoute(entrySlugs.diagnostic, locale),
  operationalAgent: (locale: Locale) =>
    bookingRoute(entrySlugs.operationalAgent, locale),
};
