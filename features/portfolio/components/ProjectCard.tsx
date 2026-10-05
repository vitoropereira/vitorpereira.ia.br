import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Project } from "../types";
import type { Locale } from "@/lib/i18n/config";

const STATUS_LABEL: Record<Project["status"], { pt: string; en: string }> = {
  completed: { pt: "Concluído", en: "Completed" },
  ongoing: { pt: "Em andamento", en: "Ongoing" },
  mvp: { pt: "MVP", en: "MVP" },
};

// Extrai o domínio de uma URL, removendo protocolo, www e caminho.
// Retorna null se a URL for inválida ou nula.
export function domainOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function ProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  return (
    <article className="bg-card group card-interactive flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
      {project.cover && (
        <div data-browser-frame className="border-b">
          <div className="bg-muted flex items-center gap-1.5 px-3 py-2">
            <span className="size-2 rounded-full bg-[#FF5F57]" aria-hidden />
            <span className="size-2 rounded-full bg-[#FEBC2E]" aria-hidden />
            <span className="size-2 rounded-full bg-[#28C840]" aria-hidden />
            {domainOf(project.url) && (
              <span className="text-muted-foreground ml-2 truncate font-mono text-[11px]">
                {domainOf(project.url)}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <Image
              src={`/images/projects/${project.cover}`}
              alt=""
              width={1280}
              height={800}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <header className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg leading-tight font-bold">
            {project.title}
          </h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            {STATUS_LABEL[project.status][locale]}
          </span>
        </header>
        <p className="text-muted-foreground mt-1 text-xs">
          {project.year}
          {project.client ? ` · ${project.client[locale]}` : ""}
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          {project.excerpt[locale]}
        </p>
        {project.results[locale].length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {project.results[locale].slice(0, 3).map((result) => (
              <li
                key={result}
                className="text-muted-foreground flex gap-2 text-sm leading-snug"
              >
                <span className="text-primary mt-px font-mono" aria-hidden="true">
                  ›
                </span>
                <span>{result}</span>
              </li>
            ))}
          </ul>
        )}
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
