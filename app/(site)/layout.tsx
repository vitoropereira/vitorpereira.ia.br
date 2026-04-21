import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/search/CommandPalette";
import { buildSearchIndex } from "@/features/blog/lib/searchIndex";
import type { Locale } from "@/lib/i18n/config";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const locale = (await getLocale()) as Locale;
  const index = buildSearchIndex(locale);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CommandPalette index={index} />
      </div>
    </NextIntlClientProvider>
  );
}
