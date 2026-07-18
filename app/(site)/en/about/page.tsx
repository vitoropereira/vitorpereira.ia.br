import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/content";
import { MdxPage } from "@/features/blog/components/MdxPage";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { JsonLd } from "@/components/seo/JsonLd";

type Page = {
  slug: string;
  locale: "pt" | "en";
  title: string;
  description?: string;
  body: string;
};

function getPage(): Page | undefined {
  return (pages as unknown as Page[]).find(
    (p) => p.slug === "sobre" && p.locale === "en",
  );
}

export function generateMetadata(): Metadata {
  const page = getPage();
  return buildMetadata({
    title: page?.title ?? "About",
    description:
      page?.description ??
      "Engineer for applied AI in business. Agents, copilots, and automation in production — with measurable results.",
    path: "/en/about",
    locale: "en",
    alternatePath: "/sobre",
    type: "website",
  });
}

export default function AboutPage() {
  const page = getPage();
  if (!page) notFound();
  return (
    <>
      <JsonLd data={{ type: "Person" }} />
      <MdxPage
        title={page.title}
        description={page.description}
        body={page.body}
        image={{ src: "/vitor.png", alt: "Vitor Pereira" }}
      />
    </>
  );
}
