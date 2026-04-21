import { notFound } from "next/navigation";
import { pages } from "@/content";
import { MdxPage } from "@/features/blog/components/MdxPage";

type Page = {
  slug: string;
  locale: "pt" | "en";
  title: string;
  description?: string;
  body: string;
};

export default function TermosPage() {
  const page = (pages as unknown as Page[]).find(
    (p) => p.slug === "termos" && p.locale === "pt",
  );
  if (!page) notFound();
  return (
    <MdxPage
      title={page.title}
      description={page.description}
      body={page.body}
    />
  );
}
