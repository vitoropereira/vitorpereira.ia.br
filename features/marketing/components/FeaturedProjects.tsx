import Link from "next/link";
import { getFeaturedProjects } from "@/features/portfolio/data/projects";
import { ProjectCard } from "@/features/portfolio/components/ProjectCard";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { Locale } from "@/lib/i18n/config";

export function FeaturedProjects({ locale }: { locale: Locale }) {
  const projects = getFeaturedProjects().slice(0, 4);
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-serif text-3xl font-bold tracking-tight">
          {locale === "pt" ? "Projetos em destaque" : "Featured projects"}
        </h2>
        <Link
          href={institutionalRoutes.portfolio[locale]}
          className="text-primary text-sm hover:underline"
        >
          {locale === "pt" ? "Ver todos →" : "See all →"}
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} locale={locale} />
        ))}
      </div>
    </section>
  );
}
