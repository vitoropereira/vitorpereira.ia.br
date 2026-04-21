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
    (p) => p.slug === "sobre" && p.locale === "pt",
  );
}

export function generateMetadata(): Metadata {
  const page = getPage();
  return buildMetadata({
    title: page?.title ?? "Sobre",
    description:
      page?.description ??
      "Full-Stack Dev com 10+ anos. CTO na I.V.Tecnologias, co-fundador de produtos, entusiasta de IA.",
    path: "/sobre",
    locale: "pt",
    alternatePath: "/en/about",
    type: "website",
  });
}

export default function SobrePage() {
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
