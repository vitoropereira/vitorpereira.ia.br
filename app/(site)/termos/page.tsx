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
    (p) => p.slug === "termos" && p.locale === "pt",
  );
}

export function generateMetadata(): Metadata {
  const page = getPage();
  return buildMetadata({
    title: page?.title ?? "Termos de Uso",
    description: page?.description ?? "Regras de uso do site vitorpereira.ia.br.",
    path: "/termos",
    locale: "pt",
    alternatePath: "/en/terms",
    type: "website",
  });
}

export default function TermosPage() {
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
