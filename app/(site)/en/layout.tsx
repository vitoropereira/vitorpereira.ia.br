import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": `${siteConfig.url}/en/rss.xml`,
    },
  },
};

export default async function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
    </NextIntlClientProvider>
  );
}
