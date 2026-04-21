import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/content";
import { MdxPage } from "@/features/blog/components/MdxPage";
import { buildMetadata } from "@/components/seo/buildMetadata";

type Page = {
  slug: string;
  locale: "pt" | "en";
  title: string;
  description?: string;
  body: string;
};

function getPage(): Page | undefined {
  return (pages as unknown as Page[]).find(
    (p) => p.slug === "privacidade" && p.locale === "en",
  );
}

export function generateMetadata(): Metadata {
  const page = getPage();
  return buildMetadata({
    title: page?.title ?? "Privacy Policy",
    description:
      page?.description ??
      "How vitorpereira.ia.br collects, uses, and stores data, in compliance with LGPD/GDPR.",
    path: "/en/privacy",
    locale: "en",
    alternatePath: "/privacidade",
    type: "website",
  });
}

export default function PrivacyPage() {
  const page = getPage();
  if (!page) notFound();
  return (
    <MdxPage
      title={page.title}
      description={page.description}
      body={page.body}
    />
  );
}
