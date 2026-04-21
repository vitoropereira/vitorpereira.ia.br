import { getLocale } from "next-intl/server";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { readConsentFromRequest } from "@/lib/consent-server";
import type { Locale } from "@/lib/i18n/config";

export async function ConsentBannerMount() {
  const [consent, locale] = await Promise.all([
    readConsentFromRequest(),
    getLocale() as Promise<Locale>,
  ]);

  return <ConsentBanner initiallyVisible={consent === null} locale={locale} />;
}
