import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Project } from "../types";
import type { Locale } from "@/lib/i18n/config";

const STATUS_LABEL: Record<Project["status"], { pt: string; en: string }> = {
  completed: { pt: "Concluído", en: "Completed" },
  ongoing: { pt: "Em andamento", en: "Ongoing" },
  mvp: { pt: "MVP", en: "MVP" },
};

export function ProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  return (
    <article className="bg-card flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
      {project.cover && (
        <Image
          src={`/images/projects/${project.cover}`}
          alt=""
          width={640}
          height={360}
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <header className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight font-bold">
            {project.title}
          </h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            {STATUS_LABEL[project.status][locale]}
          </span>
        </header>
        <p className="text-muted-foreground mt-1 text-xs">
          {project.year}
          {project.client ? ` · ${project.client}` : ""}
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          {project.excerpt[locale]}
        </p>
        <ul className="text-muted-foreground mt-4 flex flex-wrap gap-1.5 text-xs">
          {project.technologies.slice(0, 6).map((tech) => (
            <li key={tech} className="bg-muted rounded px-2 py-0.5">
              {tech}
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-4 inline-flex items-center gap-1 text-sm hover:underline"
          >
            {locale === "pt" ? "Visitar projeto" : "Visit project"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
