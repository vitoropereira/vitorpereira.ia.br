import { getTranslations } from "next-intl/server";
import { projects } from "@/features/portfolio/data/projects";
import { ProjectGrid } from "@/features/portfolio/components/ProjectGrid";

export default async function PortfolioPage() {
  const t = await getTranslations("nav");
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight">
        {t("portfolio")}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Projetos que construí ao longo dos últimos 10+ anos — SaaS próprios,
        produtos em que colaborei e trabalhos com clientes.
      </p>
      <ProjectGrid projects={projects} locale="pt" />
    </section>
  );
}
