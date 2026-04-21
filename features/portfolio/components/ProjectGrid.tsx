"use client";

import { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectCard } from "./ProjectCard";
import type { Project, ProjectCategory } from "../types";
import type { Locale } from "@/lib/i18n/config";

type StatusFilter = "all" | "current" | "past";

export function ProjectGrid({
  projects,
  locale,
}: {
  projects: Project[];
  locale: Locale;
}) {
  const [category, setCategory] = useState<ProjectCategory | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const cats = useMemo(() => {
    const set = new Set<ProjectCategory>();
    for (const p of projects) set.add(p.category);
    return ["all", ...[...set].sort()] as const;
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (status === "current" && p.status === "completed") return false;
    if (status === "past" && p.status !== "completed") return false;
    return true;
  });

  const statusLabel: Record<StatusFilter, { pt: string; en: string }> = {
    all: { pt: "Todos", en: "All" },
    current: { pt: "Atuais", en: "Current" },
    past: { pt: "Passados", en: "Past" },
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(v) => v && setCategory(v as ProjectCategory | "all")}
          aria-label="Category filter"
          variant="outline"
          size="sm"
        >
          {cats.map((c) => (
            <ToggleGroupItem key={c} value={c}>
              {c === "all" ? (locale === "pt" ? "Todas" : "All") : c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={status}
          onValueChange={(v) => v && setStatus(v as StatusFilter)}
          aria-label="Status filter"
          variant="outline"
          size="sm"
        >
          {(["all", "current", "past"] as StatusFilter[]).map((s) => (
            <ToggleGroupItem key={s} value={s}>
              {statusLabel[s][locale]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          {locale === "pt"
            ? "Nenhum projeto encontrado."
            : "No projects found."}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
