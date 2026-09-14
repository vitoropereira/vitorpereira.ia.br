import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export function resolveLocale(pathname: string): Locale {
  return (
    locales.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
    ) ?? defaultLocale
  );
}
