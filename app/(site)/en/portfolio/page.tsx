import { getTranslations } from "next-intl/server";
import { projects } from "@/features/portfolio/data/projects";
import { ProjectGrid } from "@/features/portfolio/components/ProjectGrid";

export default async function PortfolioPageEn() {
  const t = await getTranslations("nav");
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight">
        {t("portfolio")}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Projects I have built over the past 10+ years — my own SaaS, products I
        collaborated on, and client work.
      </p>
      <ProjectGrid projects={projects} locale="en" />
    </section>
  );
}
