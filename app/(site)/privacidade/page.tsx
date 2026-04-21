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
    (p) => p.slug === "privacidade" && p.locale === "pt",
  );
}

export function generateMetadata(): Metadata {
  const page = getPage();
  return buildMetadata({
    title: page?.title ?? "Política de Privacidade",
    description:
      page?.description ??
      "Como o vitorpereira.ia.br coleta, usa e armazena dados, em conformidade com a LGPD.",
    path: "/privacidade",
    locale: "pt",
    alternatePath: "/en/privacy",
    type: "website",
  });
}

export default function PrivacidadePage() {
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
