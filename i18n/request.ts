import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;
  const pathname = headerStore.get("x-pathname") ?? "";

  const pathLocale = locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  );
  const locale: Locale =
    pathLocale ??
    (cookieLocale && locales.includes(cookieLocale)
      ? cookieLocale
      : defaultLocale);

  return {
    locale,
    messages: (await import(`@/lib/i18n/messages/${locale}.json`)).default,
  };
});
