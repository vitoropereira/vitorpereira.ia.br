import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { resolveLocale } from "./resolveLocale";

export default getRequestConfig(async () => {
  const headerStore = await headers();
  const locale = resolveLocale(headerStore.get("x-pathname") ?? "");

  return {
    locale,
    messages: (await import(`@/lib/i18n/messages/${locale}.json`)).default,
  };
});
