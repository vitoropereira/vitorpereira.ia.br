import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ClarityScript } from "@/components/analytics/ClarityScript";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { GAScript } from "@/components/analytics/GAScript";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/search/CommandPalette";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSearchIndex } from "@/features/blog/lib/searchIndex";
import type { Locale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": `${siteConfig.url}/rss.xml`,
    },
  },
};

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
      <JsonLd data={{ type: "WebSite", locale }} />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CommandPalette index={index} />
      </div>
      <ConsentBanner />
      <ClarityScript />
      <GAScript />
    </NextIntlClientProvider>
  );
}
