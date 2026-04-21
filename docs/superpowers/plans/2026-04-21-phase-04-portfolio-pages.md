# Phase 4 — Portfolio + Institutional Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL:
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Migrate the eight real projects from the legacy PHP JSON to a
typed TS module, build the portfolio grid with filters, and implement
home, about, contact, privacy, and terms pages in PT and EN. At the end
every institutional route renders meaningful content.

**Architecture:** Projects live in `features/portfolio/data/projects.ts`
as typed constants. The portfolio page renders a filterable grid
(client-side filter UI, no pagination — the full list is short). About,
privacy, and terms are written as MDX (editable without redeploying
TS). Home assembles marketing blocks: Hero, Specialties,
FeaturedProjects, LatestPosts, SocialLinks, CTA.

**Tech Stack:** Next.js 15, shadcn/ui (ToggleGroup, Badge), existing MDX
pipeline.

**Reference spec:**
`/Users/vop12/projects/vitorpereira.ia.br/docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md`
— section 8 (portfolio and institutional) and spec appendix on LGPD.

**Legacy references (on `legacy-php` branch of this repo):**
- Projects JSON: `git show legacy-php:data/projects.json`
- About page: `git show legacy-php:pages/about.php`
- Home page: `git show legacy-php:pages/home.php`
- Portfolio page: `git show legacy-php:pages/portfolio.php`
- Contact page: `git show legacy-php:pages/contact.php`

**Prereq:** Phases 1, 2, 3 complete.

---

## File structure after this phase

```
app/(site)/
├── page.tsx                           # PT home (rewrite)
├── sobre/page.tsx
├── portfolio/page.tsx
├── contato/page.tsx
├── privacidade/page.tsx
├── termos/page.tsx
└── en/
    ├── page.tsx                       # EN home (rewrite)
    ├── about/page.tsx
    ├── portfolio/page.tsx
    ├── contact/page.tsx
    ├── privacy/page.tsx
    └── terms/page.tsx

content/pages/
├── sobre.mdx
├── sobre.en.mdx
├── privacidade.mdx
├── privacidade.en.mdx
├── termos.mdx
└── termos.en.mdx

features/portfolio/
├── data/projects.ts
├── types.ts
└── components/
    ├── ProjectCard.tsx
    ├── ProjectFilter.tsx
    └── ProjectGrid.tsx

features/marketing/components/
├── Hero.tsx
├── Specialties.tsx
├── FeaturedProjects.tsx
├── LatestPosts.tsx
└── ContactCTA.tsx

public/images/projects/               # (empty — you add covers manually)
```

---

## Task 1: Portfolio types

**Files:**
- Create: `features/portfolio/types.ts`

- [ ] **Step 1: Write types**

Create `features/portfolio/types.ts`:

```ts
export type ProjectCategory =
  | "web"
  | "mobile"
  | "ai"
  | "automation"
  | "analytics"
  | "saas"
  | "education"
  | "fintech"
  | "business";

export type ProjectStatus = "completed" | "ongoing" | "mvp";

export type LocalizedText = { pt: string; en: string };
export type LocalizedList = { pt: string[]; en: string[] };

export type Project = {
  id: string;
  title: string;
  excerpt: LocalizedText;
  description: LocalizedText;
  category: ProjectCategory;
  technologies: string[];
  year: string;
  status: ProjectStatus;
  featured: boolean;
  client: string | null;
  url: string | null;
  results: LocalizedList;
  cover: string | null; // path under /images/projects/
};
```

- [ ] **Step 2: Commit**

```bash
git add features/portfolio/types.ts
git commit -m "feat(portfolio): add Project types"
```

---

## Task 2: Migrate projects from legacy-php

**Files:**
- Create: `features/portfolio/data/projects.ts`

Reference data: `git show legacy-php:data/projects.json`

- [ ] **Step 1: Write projects.ts**

Create `features/portfolio/data/projects.ts`. EN copy for each project is
a faithful translation of the PT copy; you refine later.

```ts
import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "dataclarityia",
    title: "DataClarity IA",
    excerpt: {
      pt: "Plataforma IA que analisa conversas WhatsApp para insights estratégicos de negócio",
      en: "AI platform that analyzes WhatsApp conversations for strategic business insights",
    },
    description: {
      pt: "Sistema avançado de análise de conversas WhatsApp com IA, oferecendo identificação de palavras-chave, análise de sentimento, resumos automáticos e monitoramento de qualidade em tempo real para transformar dados em decisões estratégicas.",
      en: "Advanced AI-powered WhatsApp conversation analysis system offering keyword identification, sentiment analysis, automatic summaries, and real-time quality monitoring to turn data into strategic decisions.",
    },
    category: "ai",
    technologies: ["OpenAI", "WhatsApp API", "Python", "Data Analytics", "NLP"],
    year: "2024",
    status: "mvp",
    featured: true,
    client: "Projeto Próprio",
    url: "https://www.dataclarityia.com.br",
    results: {
      pt: [
        "MVP em lançamento com 10 beta testers",
        "Análise de sentimento em tempo real",
        "Identificação automática de tópicos e tendências",
      ],
      en: [
        "MVP launching with 10 beta testers",
        "Real-time sentiment analysis",
        "Automatic topic and trend identification",
      ],
    },
    cover: null,
  },
  {
    id: "insightvideoia",
    title: "Insight Video IA",
    excerpt: {
      pt: "Transforme vídeos educacionais em e-books, resumos e quizzes com IA",
      en: "Turn educational videos into e-books, summaries, and quizzes with AI",
    },
    description: {
      pt: "Plataforma que utiliza IA para transcrever vídeos educacionais e gerar automaticamente materiais didáticos diversos como e-books, resumos, quizzes interativos e mapas mentais. Suporte multilíngue e edição flexível de conteúdo gerado.",
      en: "Platform that uses AI to transcribe educational videos and automatically generate teaching materials such as e-books, summaries, interactive quizzes, and mind maps. Multilingual support and flexible editing of generated content.",
    },
    category: "ai",
    technologies: ["OpenAI", "Video Processing", "NLP", "React", "Python"],
    year: "2024",
    status: "completed",
    featured: true,
    client: "Projeto Próprio",
    url: "https://www.insightvideoia.com.br",
    results: {
      pt: [
        "Transcrição instantânea com alta precisão",
        "Geração automática de materiais educacionais",
        "Suporte a múltiplos idiomas",
      ],
      en: [
        "Instant transcription with high accuracy",
        "Automatic generation of educational materials",
        "Multilingual support",
      ],
    },
    cover: null,
  },
  {
    id: "calvino",
    title: "Calvino — Assistente IA Teológico",
    excerpt: {
      pt: "Chatbot especializado para pastores com pesquisa teológica reformada",
      en: "Specialized chatbot for pastors with reformed theological research",
    },
    description: {
      pt: "Assistente de IA focado em teologia reformada, oferecendo suporte à pregação expositiva, pesquisa teológica, preparação de sermões e análise de documentos. Inclui modelos avançados de IA e assistentes personalizados.",
      en: "AI assistant focused on reformed theology, offering support for expository preaching, theological research, sermon preparation, and document analysis. Includes advanced AI models and personalized assistants.",
    },
    category: "ai",
    technologies: ["OpenAI", "GPT-4", "Document AI", "React", "Node.js"],
    year: "2024",
    status: "completed",
    featured: true,
    client: "Projeto Próprio",
    url: "https://calvino.com.br",
    results: {
      pt: [
        "R$ 29,90/mês — modelo de assinatura ativo",
        "Conversas ilimitadas e upload de documentos",
        "Suporte prioritário para pastores e teólogos",
      ],
      en: [
        "R$ 29.90/month active subscription model",
        "Unlimited conversations and document uploads",
        "Priority support for pastors and theologians",
      ],
    },
    cover: null,
  },
  {
    id: "mygroupmetrics",
    title: "My Group Metrics",
    excerpt: {
      pt: "Analytics e gestão de comunidades WhatsApp com crescimento de até 40%",
      en: "Analytics and management for WhatsApp communities with up to 40% growth",
    },
    description: {
      pt: "Ferramenta completa de gestão e analytics para comunidades WhatsApp, oferecendo resumos diários, relatórios de engajamento, identificação de hot topics, agendamento de mensagens e análise detalhada de atividade de membros.",
      en: "Complete management and analytics tool for WhatsApp communities, offering daily summaries, engagement reports, hot-topic identification, message scheduling, and detailed member activity analysis.",
    },
    category: "automation",
    technologies: ["WhatsApp API", "N8N", "Analytics", "Bot", "Data Visualization"],
    year: "2024",
    status: "completed",
    featured: true,
    client: "My Group Metrics (Desenvolvedor)",
    url: "https://mygroupmetrics.com/",
    results: {
      pt: [
        "250+ gestores de comunidade utilizando",
        "190.987+ resumos gerados",
        "Crescimento de até 40% no engajamento",
      ],
      en: [
        "250+ community managers using it",
        "190,987+ summaries generated",
        "Up to 40% engagement growth",
      ],
    },
    cover: null,
  },
  {
    id: "microsaas-brasil",
    title: "Micro-SaaS Brasil",
    excerpt: {
      pt: "Comunidade e educação sobre criação de negócios Micro-SaaS",
      en: "Community and education on building Micro-SaaS businesses",
    },
    description: {
      pt: "Plataforma educacional e comunidade focada em ensinar empreendedores a criar, lançar e escalar Micro-SaaS. Oferece cursos práticos, mentoria, networking e suporte completo da ideia ao lançamento.",
      en: "Educational platform and community focused on teaching entrepreneurs how to build, launch, and scale Micro-SaaS. Offers practical courses, mentorship, networking, and full support from idea to launch.",
    },
    category: "saas",
    technologies: ["Next.js", "Community Platform", "Educational Content", "SaaS"],
    year: "2024",
    status: "ongoing",
    featured: true,
    client: "Micro-SaaS Brasil (Desenvolvedor)",
    url: "https://microsaas.com.br/",
    results: {
      pt: [
        "Cursos 'Zero to Micro-SaaS' e 'Micro-SaaS com AI'",
        "Comunidade ativa de empreendedores",
        "Potencial de receita R$ 5k-50k/mês para alunos",
      ],
      en: [
        "'Zero to Micro-SaaS' and 'Micro-SaaS with AI' courses",
        "Active entrepreneur community",
        "Revenue potential of R$ 5k-50k/month for students",
      ],
    },
    cover: null,
  },
  {
    id: "4trip",
    title: "4trip Agência Receptiva",
    excerpt: {
      pt: "Agência de turismo receptivo em Alagoas e Pernambuco",
      en: "Inbound tourism agency in Alagoas and Pernambuco",
    },
    description: {
      pt: "Plataforma completa para agência de turismo receptivo especializada em destinos do Nordeste, incluindo sistema de reservas, gestão de tours, transfers, integração com parceiros e plataforma de pagamentos online.",
      en: "Full platform for an inbound tourism agency specializing in Northeast Brazil destinations, including booking system, tour management, transfers, partner integrations, and online payments.",
    },
    category: "web",
    technologies: ["React", "Node.js", "Express", "MongoDB", "API Integration"],
    year: "2020-2024",
    status: "completed",
    featured: true,
    client: "4trip Agência (Co-founder)",
    url: "https://4trip.com.br/",
    results: {
      pt: [
        "11.500+ experiências realizadas",
        "Traveler's Choice TripAdvisor 2023 e 2024",
        "Cobertura completa: Porto de Galinhas, Maragogi, Carneiros",
      ],
      en: [
        "11,500+ experiences delivered",
        "Traveler's Choice TripAdvisor 2023 and 2024",
        "Full coverage: Porto de Galinhas, Maragogi, Carneiros",
      ],
    },
    cover: null,
  },
  {
    id: "ajudaja",
    title: "AjudaJá — Plataforma de Doações",
    excerpt: {
      pt: "Crowdfunding online que arrecadou R$ 2,7 milhões em 2025",
      en: "Online crowdfunding that raised R$ 2.7M in 2025",
    },
    description: {
      pt: "Plataforma de crowdfunding e doações online focada em impacto social, permitindo criação rápida de campanhas, integração com redes sociais, tracking transparente de doações e gestão completa de arrecadações.",
      en: "Crowdfunding and online donations platform focused on social impact, allowing fast campaign creation, social media integration, transparent donation tracking, and full fundraising management.",
    },
    category: "fintech",
    technologies: ["React", "Node.js", "Payment Gateway", "Social Integration"],
    year: "2022",
    status: "completed",
    featured: false,
    client: "AjudaJá (Co-founder, Aug-Dec 2022)",
    url: "https://ajudaja.com.br/",
    results: {
      pt: [
        "R$ 2,7 milhões arrecadados em 2025",
        "124.000+ campanhas impulsionadas",
        "85.000+ usuários engajados",
      ],
      en: [
        "R$ 2.7M raised in 2025",
        "124,000+ campaigns boosted",
        "85,000+ engaged users",
      ],
    },
    cover: null,
  },
  {
    id: "sgcm",
    title: "SGCM — Sistema de Gestão de Condomínios",
    excerpt: {
      pt: "Sistema completo para gerenciamento de condomínios militares",
      en: "Full management system for military condominiums",
    },
    description: {
      pt: "Plataforma web e mobile para gestão de condomínios militares, incluindo controle de moradores, gestão financeira, comunicação interna, reservas de áreas comuns e suporte via WhatsApp.",
      en: "Web and mobile platform for military condominium management, including resident control, financial management, internal communication, amenity reservations, and WhatsApp support.",
    },
    category: "web",
    technologies: ["PHP", "MySQL", "React Native", "iOS", "Android"],
    year: "2015-2024",
    status: "completed",
    featured: false,
    client: "I.V.Tecnologias Web Ltda",
    url: "https://sgcm.com.br/",
    results: {
      pt: [
        "Apps disponíveis iOS e Android",
        "Interface web responsiva completa",
        "Gestão de múltiplos condomínios militares",
      ],
      en: [
        "Apps available on iOS and Android",
        "Full responsive web interface",
        "Management of multiple military condominiums",
      ],
    },
    cover: null,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export function getProjectsByStatus(status: "all" | "current" | "past"): Project[] {
  if (status === "all") return projects;
  if (status === "current") return projects.filter((p) => p.status !== "completed");
  return projects.filter((p) => p.status === "completed");
}
```

- [ ] **Step 2: Commit**

```bash
git add features/portfolio/data/
git commit -m "feat(portfolio): migrate 8 real projects from legacy PHP to typed TS"
```

---

## Task 3: ProjectCard

**Files:**
- Create: `features/portfolio/components/ProjectCard.tsx`

- [ ] **Step 1: Write component**

Create `features/portfolio/components/ProjectCard.tsx`:

```tsx
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
    <article className="flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
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
          <h3 className="font-serif text-lg font-bold leading-tight">
            {project.title}
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {STATUS_LABEL[project.status][locale]}
          </span>
        </header>
        <p className="mt-1 text-xs text-muted-foreground">
          {project.year}{project.client ? ` · ${project.client}` : ""}
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          {project.excerpt[locale]}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {project.technologies.slice(0, 6).map((tech) => (
            <li key={tech} className="rounded bg-muted px-2 py-0.5">
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
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {locale === "pt" ? "Visitar projeto" : "Visit project"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/portfolio/components/ProjectCard.tsx
git commit -m "feat(portfolio): add ProjectCard component"
```

---

## Task 4: ProjectFilter and ProjectGrid

**Files:**
- Create: `features/portfolio/components/ProjectFilter.tsx`,
  `features/portfolio/components/ProjectGrid.tsx`

- [ ] **Step 1: Install shadcn toggle-group**

```bash
pnpm dlx shadcn@latest add toggle-group
```

- [ ] **Step 2: Write ProjectFilter + ProjectGrid (client component)**

Create `features/portfolio/components/ProjectGrid.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
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
        <p className="py-12 text-center text-muted-foreground">
          {locale === "pt" ? "Nenhum projeto encontrado." : "No projects found."}
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
```

- [ ] **Step 3: Commit**

```bash
git add features/portfolio/components/ProjectGrid.tsx package.json pnpm-lock.yaml components/ui/toggle-group.tsx
git commit -m "feat(portfolio): add ProjectGrid with category and status filters"
```

---

## Task 5: Portfolio pages (PT + EN)

**Files:**
- Create: `app/(site)/portfolio/page.tsx`,
  `app/(site)/en/portfolio/page.tsx`

- [ ] **Step 1: Write PT page**

Create `app/(site)/portfolio/page.tsx`:

```tsx
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
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Projetos que construí ao longo dos últimos 10+ anos — SaaS próprios,
        produtos em que colaborei e trabalhos com clientes.
      </p>
      <ProjectGrid projects={projects} locale="pt" />
    </section>
  );
}
```

- [ ] **Step 2: Write EN page**

Create `app/(site)/en/portfolio/page.tsx`:

```tsx
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
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Projects I have built over the past 10+ years — my own SaaS, products
        I collaborated on, and client work.
      </p>
      <ProjectGrid projects={projects} locale="en" />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/portfolio/page.tsx" "app/(site)/en/portfolio/page.tsx"
git commit -m "feat(portfolio): add portfolio pages PT and EN"
```

---

## Task 6: About pages in MDX

**Files:**
- Create: `content/pages/sobre.mdx`, `content/pages/sobre.en.mdx`

Source: `git show legacy-php:pages/about.php` on the `legacy-php` branch.
The PHP has HTML markup; extract the copy and port into MDX.

- [ ] **Step 1: Write sobre.mdx (PT)**

Create `content/pages/sobre.mdx`:

```mdx
---
title: "Sobre mim"
description: "Full-Stack Dev com mais de 10 anos de experiência. CTO na I.V.Tecnologias, co-fundador de múltiplos produtos e entusiasta de automação com IA."
---

Olá! Sou **Vitor Pereira**, Full-Stack Developer com mais de **10 anos de
experiência**, especializado em **JavaScript/TypeScript**, React, Next.js,
Node.js e automações com IA.

Minha jornada começou no **Controle de Tráfego Aéreo** (DECEA), onde
desenvolvi gestão de processos críticos e tomada de decisão sob pressão.
Essa base me deu disciplina e metodologia que aplico no desenvolvimento
de software.

Atualmente atuo como **CTO** na I.V.Tecnologias e **co-fundador** de
múltiplas iniciativas, incluindo a 4trip Agência e projetos de Micro-SaaS.
Especializo-me em automações com N8N, integrações OpenAI, OCR e
desenvolvimento end-to-end.

Tenho certificações Rocketseat (GoStack 9.8/10, Semana OmniStack) e
experiência como Code Reviewer na Scale AI.

## Minha jornada

- **2024** — Multi-roles: CTO @ I.V.Tecnologias, Co-founder @ 4trip
  Agência, AI Code Reviewer @ Scale AI, dev de Micro-SaaS. Especialização
  em automações WhatsApp e análise de dados.
- **2022** — Co-founder AjudaJá (Ago-Dez 2022) e 4trip Agência.
  Empreendedorismo e gestão.
- **2020** — Especialista certificado Rocketseat (9.8/10) no GoStack e
  Semana OmniStack.
- **2018** — Transição formal para desenvolvimento web (Udemy: HTML, CSS,
  JavaScript).
- **2015** — Início da jornada como CTO na I.V.Tecnologias Web Ltda.
- **2009** — 6 anos e 8 meses no Controle de Tráfego Aéreo (DECEA, até
  2022).

## Informações rápidas

- **Localização:** Recife, Pernambuco
- **Experiência:** 10+ anos
- **Especialização:** Full-Stack & Automações IA
- **Idiomas:** Português, Inglês
- **Status:** Disponível para conversar sobre projetos
```

- [ ] **Step 2: Write sobre.en.mdx**

Create `content/pages/sobre.en.mdx`:

```mdx
---
title: "About me"
description: "Full-Stack Dev with 10+ years of experience. CTO at I.V.Tecnologias, co-founder of multiple products, and AI automation enthusiast."
---

Hi! I'm **Vitor Pereira**, Full-Stack Developer with **10+ years of
experience**, specialized in **JavaScript/TypeScript**, React, Next.js,
Node.js, and AI automation.

My path started in **Air Traffic Control** (DECEA), where I built skills
around critical process management and decision-making under pressure.
That foundation shaped the discipline and methodology I apply to software
engineering today.

I currently serve as **CTO** at I.V.Tecnologias and **co-founder** of
multiple initiatives, including 4trip Agência and several Micro-SaaS
products. I focus on N8N automations, OpenAI integrations, OCR, and
end-to-end product development.

I hold Rocketseat certifications (GoStack 9.8/10, OmniStack Week) and
worked as an AI Code Reviewer at Scale AI.

## Career timeline

- **2024** — Multi-roles: CTO @ I.V.Tecnologias, Co-founder @ 4trip, AI
  Code Reviewer @ Scale AI, Micro-SaaS builder. Focus on WhatsApp
  automation and data analysis.
- **2022** — Co-founder of AjudaJá (Aug-Dec 2022) and 4trip Agência.
  Entrepreneurship and management.
- **2020** — Certified Specialist at Rocketseat (9.8/10) on GoStack and
  OmniStack Week.
- **2018** — Formal transition into web development (Udemy: HTML, CSS,
  JavaScript).
- **2015** — Started as CTO at I.V.Tecnologias Web Ltda.
- **2009** — 6 years and 8 months in Air Traffic Control (DECEA, until
  2022).

## Quick facts

- **Location:** Recife, Pernambuco, Brazil
- **Experience:** 10+ years
- **Specialization:** Full-Stack & AI automation
- **Languages:** Portuguese, English
- **Status:** Open to project conversations
```

- [ ] **Step 3: Extend Velite collection for pages**

We need to extend `velite.config.ts` to also compile `content/pages/*.mdx`.
Add a new collection `pages`:

Modify `velite.config.ts`. Inside `collections`, add after `posts`:

```ts
pages: {
  name: "Page",
  pattern: "pages/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      body: s.string().default(""),
      slug: s.string().default(""),
      locale: s.enum(["pt", "en"] as const).default("pt"),
    })
    .transform((data, { meta }) => {
      const filePath = (meta.path ?? "").replace(/\\/g, "/");
      const m = filePath.match(/content\/pages\/([^/]+?)(\.en)?\.mdx$/);
      if (!m) throw new Error(`Unexpected page path: ${filePath}`);
      const [, slug, enFlag] = m;
      return {
        ...data,
        slug,
        locale: enFlag ? "en" : "pt",
        body: (meta.content ?? "") as string,
      };
    }),
},
```

- [ ] **Step 4: Build Velite and commit**

```bash
pnpm velite build
git add content/pages/ velite.config.ts
git commit -m "content: migrate about page from legacy PHP to MDX (PT + EN) and extend Velite"
```

---

## Task 7: About page routes

**Files:**
- Create: `app/(site)/sobre/page.tsx`, `app/(site)/en/about/page.tsx`

- [ ] **Step 1: Create a shared page renderer**

Create `features/blog/components/MdxPage.tsx`:

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../mdx/MDXComponents";
import { mdxOptions } from "@/lib/mdx/mdx-options";

export function MdxPage({
  title,
  description,
  body,
}: {
  title: string;
  description?: string;
  body: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mb-8 text-muted-foreground">{description}</p>
      )}
      <article className="prose-post">
        <MDXRemote
          source={body}
          components={mdxComponents}
          options={{ mdxOptions }}
        />
      </article>
    </section>
  );
}
```

- [ ] **Step 2: PT about page**

Create `app/(site)/sobre/page.tsx`:

```tsx
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

export default function SobrePage() {
  const all = pages as unknown as Page[];
  const page = all.find((p) => p.slug === "sobre" && p.locale === "pt");
  if (!page) notFound();
  return (
    <MdxPage
      title={page.title}
      description={page.description}
      body={page.body}
    />
  );
}
```

- [ ] **Step 3: EN about page**

Create `app/(site)/en/about/page.tsx`:

```tsx
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

export default function AboutPage() {
  const all = pages as unknown as Page[];
  const page = all.find((p) => p.slug === "sobre" && p.locale === "en");
  if (!page) notFound();
  return (
    <MdxPage
      title={page.title}
      description={page.description}
      body={page.body}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add features/blog/components/MdxPage.tsx "app/(site)/sobre/" "app/(site)/en/about/"
git commit -m "feat: add about pages PT and EN rendered from MDX"
```

---

## Task 8: Contact pages (social links only)

**Files:**
- Create: `app/(site)/contato/page.tsx`,
  `app/(site)/en/contact/page.tsx`

- [ ] **Step 1: Create PT page**

Create `app/(site)/contato/page.tsx`:

```tsx
import Link from "next/link";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const items = [
  {
    name: "LinkedIn",
    href: siteConfig.social.linkedin,
    icon: Linkedin,
    pt: "Conteúdo mais profissional, projetos e histórico.",
    en: "Professional content, projects, and work history.",
  },
  {
    name: "GitHub",
    href: siteConfig.social.github,
    icon: Github,
    pt: "Código, projetos open source e experimentos.",
    en: "Code, open source projects, and experiments.",
  },
  {
    name: "X (Twitter)",
    href: siteConfig.social.x,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    pt: "Comentários rápidos sobre tech, SaaS e dev.",
    en: "Quick takes on tech, SaaS, and dev.",
  },
  {
    name: "Instagram",
    href: siteConfig.social.instagram,
    icon: Instagram,
    pt: "Bastidores, dia a dia e ideias rápidas.",
    en: "Behind the scenes, daily life, and quick ideas.",
  },
  {
    name: "YouTube",
    href: siteConfig.social.youtube,
    icon: Youtube,
    pt: "Vídeos sobre dev, SaaS e produto.",
    en: "Videos on dev, SaaS, and product.",
  },
  {
    name: "TabNews",
    href: siteConfig.social.tabnews,
    icon: () => <span className="text-sm font-bold">TN</span>,
    pt: "Artigos e discussões na comunidade de devs.",
    en: "Articles and discussions in the Brazilian dev community.",
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight">
        Vamos conversar
      </h1>
      <p className="mb-10 max-w-2xl text-muted-foreground">
        Sou mais ativo nas redes abaixo. Escolha a que preferir —
        respondo em todas.
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-lg border p-5 transition hover:border-primary hover:bg-accent"
            >
              <div className="mt-0.5 text-muted-foreground">
                <item.icon />
              </div>
              <div>
                <h2 className="font-sans font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.pt}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Create EN page**

Create `app/(site)/en/contact/page.tsx`:

```tsx
import Link from "next/link";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";

const items = [
  { name: "LinkedIn", href: siteConfig.social.linkedin, icon: Linkedin, desc: "Professional content, projects, and work history." },
  { name: "GitHub", href: siteConfig.social.github, icon: Github, desc: "Code, open source projects, and experiments." },
  { name: "X (Twitter)", href: siteConfig.social.x, icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ), desc: "Quick takes on tech, SaaS, and dev." },
  { name: "Instagram", href: siteConfig.social.instagram, icon: Instagram, desc: "Behind the scenes, daily life, and quick ideas." },
  { name: "YouTube", href: siteConfig.social.youtube, icon: Youtube, desc: "Videos on dev, SaaS, and product." },
  { name: "TabNews", href: siteConfig.social.tabnews, icon: () => <span className="text-sm font-bold">TN</span>, desc: "Articles and discussions in the Brazilian dev community." },
];

export default function ContactPageEn() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight">
        Let's talk
      </h1>
      <p className="mb-10 max-w-2xl text-muted-foreground">
        I'm most active on the networks below. Pick the one you prefer —
        I answer on all of them.
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-lg border p-5 transition hover:border-primary hover:bg-accent"
            >
              <div className="mt-0.5 text-muted-foreground">
                <item.icon />
              </div>
              <div>
                <h2 className="font-sans font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/contato/" "app/(site)/en/contact/"
git commit -m "feat: add contact pages (social links only) PT and EN"
```

---

## Task 9: Marketing blocks (Hero, Specialties, FeaturedProjects, LatestPosts, CTA)

**Files:**
- Create: `features/marketing/components/Hero.tsx`, `Specialties.tsx`,
  `FeaturedProjects.tsx`, `LatestPosts.tsx`, `ContactCTA.tsx`

- [ ] **Step 1: Hero**

Create `features/marketing/components/Hero.tsx`:

```tsx
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
      <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
        {siteConfig.tagline[locale]}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Specialties**

Create `features/marketing/components/Specialties.tsx`:

```tsx
import { Bot, Cpu, Layers, Workflow } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const items = [
  {
    icon: Bot,
    pt: { title: "Produtos com IA", desc: "LLMs, agentes, RAG, automação inteligente aplicada a negócios." },
    en: { title: "AI products", desc: "LLMs, agents, RAG, intelligent automation applied to business." },
  },
  {
    icon: Workflow,
    pt: { title: "Automação & SaaS", desc: "N8N, integrações, Micro-SaaS escaláveis e eficientes." },
    en: { title: "Automation & SaaS", desc: "N8N, integrations, scalable and efficient Micro-SaaS." },
  },
  {
    icon: Layers,
    pt: { title: "Full-Stack moderno", desc: "React, Next.js, Node.js, TypeScript end-to-end." },
    en: { title: "Modern full-stack", desc: "React, Next.js, Node.js, TypeScript end-to-end." },
  },
  {
    icon: Cpu,
    pt: { title: "Análise de dados", desc: "OCR, NLP, pipelines para insights acionáveis." },
    en: { title: "Data analysis", desc: "OCR, NLP, pipelines for actionable insights." },
  },
];

export function Specialties({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="mb-8 text-center font-serif text-3xl font-bold tracking-tight">
        {locale === "pt" ? "O que eu faço" : "What I do"}
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, ...it }) => (
          <div key={it[locale].title} className="rounded-lg border p-5">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-sans font-semibold">{it[locale].title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {it[locale].desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: FeaturedProjects**

Create `features/marketing/components/FeaturedProjects.tsx`:

```tsx
import { getFeaturedProjects } from "@/features/portfolio/data/projects";
import { ProjectCard } from "@/features/portfolio/components/ProjectCard";
import type { Locale } from "@/lib/i18n/config";
import Link from "next/link";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

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
          className="text-sm text-primary hover:underline"
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
```

- [ ] **Step 4: LatestPosts**

Create `features/marketing/components/LatestPosts.tsx`:

```tsx
import Link from "next/link";
import { getPostsByLocale } from "@/features/blog/lib/queries";
import type { Locale } from "@/lib/i18n/config";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export function LatestPosts({ locale }: { locale: Locale }) {
  const posts = getPostsByLocale(locale, { limit: 5, includeDrafts: false });
  if (posts.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-serif text-3xl font-bold tracking-tight">
          {locale === "pt" ? "Últimos posts" : "Latest posts"}
        </h2>
        <Link
          href={institutionalRoutes.postsList[locale]}
          className="text-sm text-primary hover:underline"
        >
          {locale === "pt" ? "Ver todos →" : "See all →"}
        </Link>
      </div>
      <ul className="divide-y rounded-lg border">
        {posts.map((p) => (
          <li key={p.permalink}>
            <Link
              href={p.permalink}
              className="flex items-baseline justify-between gap-4 p-4 hover:bg-accent"
            >
              <span className="font-serif font-semibold">{p.title}</span>
              <time className="text-xs text-muted-foreground">
                {new Date(p.date).toLocaleDateString(
                  locale === "pt" ? "pt-BR" : "en-US",
                  { year: "numeric", month: "short", day: "numeric" },
                )}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: ContactCTA**

Create `features/marketing/components/ContactCTA.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { Locale } from "@/lib/i18n/config";

export function ContactCTA({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="font-serif text-3xl font-bold tracking-tight">
        {locale === "pt" ? "Vamos conversar?" : "Let's talk?"}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        {locale === "pt"
          ? "Tem um projeto em mente, uma ideia de SaaS, ou só quer trocar ideia? Me chama."
          : "Got a project in mind, a SaaS idea, or just want to chat? Reach out."}
      </p>
      <Button asChild className="mt-6">
        <Link href={institutionalRoutes.contact[locale]}>
          {locale === "pt" ? "Entrar em contato" : "Get in touch"}
        </Link>
      </Button>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add features/marketing/
git commit -m "feat(marketing): add Hero, Specialties, FeaturedProjects, LatestPosts, ContactCTA"
```

---

## Task 10: Home pages (rewrite)

**Files:**
- Modify: `app/(site)/page.tsx`, `app/(site)/en/page.tsx`

- [ ] **Step 1: Rewrite PT home**

Replace `app/(site)/page.tsx`:

```tsx
import { Hero } from "@/features/marketing/components/Hero";
import { Specialties } from "@/features/marketing/components/Specialties";
import { FeaturedProjects } from "@/features/marketing/components/FeaturedProjects";
import { LatestPosts } from "@/features/marketing/components/LatestPosts";
import { ContactCTA } from "@/features/marketing/components/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero locale="pt" />
      <Specialties locale="pt" />
      <FeaturedProjects locale="pt" />
      <LatestPosts locale="pt" />
      <ContactCTA locale="pt" />
    </>
  );
}
```

- [ ] **Step 2: Rewrite EN home**

Replace `app/(site)/en/page.tsx`:

```tsx
import { Hero } from "@/features/marketing/components/Hero";
import { Specialties } from "@/features/marketing/components/Specialties";
import { FeaturedProjects } from "@/features/marketing/components/FeaturedProjects";
import { LatestPosts } from "@/features/marketing/components/LatestPosts";
import { ContactCTA } from "@/features/marketing/components/ContactCTA";

export default function HomePageEn() {
  return (
    <>
      <Hero locale="en" />
      <Specialties locale="en" />
      <FeaturedProjects locale="en" />
      <LatestPosts locale="en" />
      <ContactCTA locale="en" />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/page.tsx" "app/(site)/en/page.tsx"
git commit -m "feat: assemble home pages PT and EN from marketing blocks"
```

---

## Task 11: Privacy policy MDX templates

**Files:**
- Create: `content/pages/privacidade.mdx`,
  `content/pages/privacidade.en.mdx`

- [ ] **Step 1: Write privacidade.mdx**

Create `content/pages/privacidade.mdx`:

```mdx
---
title: "Política de Privacidade"
description: "Como o vitorpereira.ia.br coleta, usa e armazena dados, em conformidade com a LGPD."
---

Última atualização: **21 de abril de 2026**.

## Quem somos

O site vitorpereira.ia.br é mantido por **Vitor Onofre Pereira**, pessoa
física, CNPJ a ser definido. Para dúvidas relativas a privacidade, entre
em contato via um dos canais listados em [/contato](/contato).

## Dados que coletamos

**Com seu consentimento explícito**, coletamos via Google Analytics 4 e
Microsoft Clarity dados de uso anônimos, incluindo:

- Endereço IP (parcialmente ofuscado pelo Google)
- Navegador, sistema operacional, dispositivo
- Páginas visitadas, tempo de permanência, origem do tráfego
- Gravações de sessão e heatmaps (Clarity) sem captura de dados sensíveis

**Sem consentimento**, apenas dados agregados do Vercel Analytics são
coletados — este serviço **não usa cookies** e não identifica usuários
individualmente.

Nenhum formulário do site solicita dados pessoais identificáveis. Caso
entre em contato via redes sociais, aplicam-se as políticas dessas
respectivas plataformas.

## Base legal

- **Vercel Analytics:** legítimo interesse (Art. 7, IX da LGPD)
- **Google Analytics e Microsoft Clarity:** consentimento (Art. 7, I da
  LGPD), obtido via banner no primeiro acesso.

## Compartilhamento

Dados coletados são processados por:

- Google LLC (Google Analytics)
- Microsoft Corporation (Clarity)
- Vercel Inc. (hospedagem e Analytics)

Esses fornecedores possuem suas próprias políticas de privacidade. Não
vendemos dados a terceiros.

## Seus direitos (LGPD)

Você tem direito a:

- Confirmar a existência de tratamento
- Acessar os dados
- Corrigir dados incompletos ou desatualizados
- Solicitar anonimização, bloqueio ou eliminação
- Revogar consentimento a qualquer momento (link "Gerenciar cookies" no
  rodapé)

Para exercer esses direitos, entre em contato pelos canais em
[/contato](/contato).

## Cookies

Usamos cookies:

- `NEXT_LOCALE` — salva sua preferência de idioma (necessário)
- `consent` — registra sua escolha sobre analytics (necessário)
- Cookies de Google Analytics (`_ga`, `_gid`) — somente com consentimento
- Cookies de Microsoft Clarity (`_clck`, `_clsk`) — somente com
  consentimento

## Alterações desta política

Podemos atualizar esta política. A data da última alteração sempre constará
no topo.

## Contato

Para qualquer dúvida, contate o autor pelas redes sociais em
[/contato](/contato).

> **Nota:** este documento é um template. **Revise com seu advogado antes
> de considerá-lo final**, especialmente se o site começar a receber
> formulários de contato, newsletter ou processar pagamentos.
```

- [ ] **Step 2: Write privacidade.en.mdx**

Create `content/pages/privacidade.en.mdx` — faithful translation of the
same template, titled "Privacy Policy".

```mdx
---
title: "Privacy Policy"
description: "How vitorpereira.ia.br collects, uses, and stores data, in compliance with LGPD/GDPR."
---

Last updated: **April 21, 2026**.

## Who we are

The website vitorpereira.ia.br is maintained by **Vitor Onofre Pereira**,
individual, based in Brazil. For privacy-related questions, contact us
through one of the channels listed at [/en/contact](/en/contact).

## Data we collect

**With your explicit consent**, we collect anonymous usage data through
Google Analytics 4 and Microsoft Clarity, including:

- IP address (partially obfuscated by Google)
- Browser, operating system, device
- Pages visited, time on page, traffic source
- Session recordings and heatmaps (Clarity) without sensitive data capture

**Without consent**, only aggregated Vercel Analytics data is collected —
this service **does not use cookies** and does not identify individual
users.

No form on the site requests personally identifiable information. If you
reach out through social networks, those platforms' privacy policies
apply.

## Legal basis

- **Vercel Analytics:** legitimate interest (Art. 6(1)(f) GDPR / Art. 7 IX
  LGPD)
- **Google Analytics and Microsoft Clarity:** consent (Art. 6(1)(a) GDPR /
  Art. 7 I LGPD), via the banner on first visit.

## Sharing

Collected data is processed by:

- Google LLC (Google Analytics)
- Microsoft Corporation (Clarity)
- Vercel Inc. (hosting and Analytics)

These providers have their own privacy policies. We do not sell data to
third parties.

## Your rights

You have the right to:

- Confirm the existence of processing
- Access the data
- Rectify incomplete or outdated data
- Request anonymization, blocking, or deletion
- Withdraw consent at any time ("Manage cookies" link in the footer)

To exercise these rights, contact us via [/en/contact](/en/contact).

## Cookies

We use cookies:

- `NEXT_LOCALE` — stores language preference (required)
- `consent` — records analytics choice (required)
- Google Analytics cookies (`_ga`, `_gid`) — only with consent
- Microsoft Clarity cookies (`_clck`, `_clsk`) — only with consent

## Changes to this policy

We may update this policy. The latest update date will always appear at
the top.

## Contact

For any questions, reach out via social channels at
[/en/contact](/en/contact).

> **Note:** this document is a template. **Review with your lawyer before
> treating it as final**, especially if the site starts collecting
> contact forms, newsletter signups, or processing payments.
```

- [ ] **Step 3: Commit**

```bash
git add content/pages/privacidade*
git commit -m "content: add privacy policy templates (PT + EN) — LGPD/GDPR draft"
```

---

## Task 12: Terms of service MDX templates

**Files:**
- Create: `content/pages/termos.mdx`, `content/pages/termos.en.mdx`

- [ ] **Step 1: Write termos.mdx**

Create `content/pages/termos.mdx`:

```mdx
---
title: "Termos de Uso"
description: "Regras de uso do site vitorpereira.ia.br."
---

Última atualização: **21 de abril de 2026**.

## Aceitação

Ao acessar o site vitorpereira.ia.br, você concorda com estes termos. Se
não concordar, por favor não use o site.

## Propriedade intelectual

Todo o conteúdo publicado (textos, imagens, código de exemplo) é de autoria
de Vitor Onofre Pereira, salvo indicação em contrário. Você pode:

- Compartilhar links
- Citar trechos com atribuição (máximo de 250 palavras)
- Usar o código de exemplo dos posts em seus próprios projetos sob licença
  MIT, salvo indicação diferente no próprio post

Você **não pode**:

- Reproduzir artigos integralmente em outro meio sem autorização por
  escrito
- Usar marca, nome ou imagem para sugerir endosso sem autorização

## Isenção de responsabilidade

O conteúdo é fornecido "como está". Não garantimos:

- Exatidão técnica absoluta (pode haver erros)
- Atualidade em posts antigos (tecnologia muda rápido)
- Adequação a qualquer finalidade específica

**Não somos responsáveis** por prejuízos decorrentes do uso ou inabilidade
de uso do conteúdo. Consulte profissionais qualificados para decisões que
tenham impacto no seu negócio.

## Conduta

Ao comentar (via Giscus), você concorda em:

- Não publicar conteúdo ilegal, ofensivo, difamatório ou spam
- Respeitar os termos do GitHub, que hospeda as discussões

Comentários podem ser moderados ou removidos a critério do autor.

## Links externos

O site contém links para serviços terceiros. Não controlamos nem nos
responsabilizamos pelo conteúdo desses sites.

## Alterações

Estes termos podem ser atualizados. Mudanças significativas serão
sinalizadas no topo do documento.

## Lei aplicável

Estes termos são regidos pelas leis do Brasil. Foro da comarca de Recife,
PE, Brasil.

> **Nota:** template inicial. Revise com seu advogado antes de tratar como
> definitivo.
```

- [ ] **Step 2: Write termos.en.mdx**

Create `content/pages/termos.en.mdx`:

```mdx
---
title: "Terms of Use"
description: "Rules for using vitorpereira.ia.br."
---

Last updated: **April 21, 2026**.

## Acceptance

By accessing vitorpereira.ia.br you agree to these terms. If you do not
agree, please do not use the site.

## Intellectual property

All published content (text, images, sample code) is authored by Vitor
Onofre Pereira unless otherwise indicated. You may:

- Share links
- Quote excerpts with attribution (up to 250 words)
- Use sample code from posts in your own projects under the MIT license,
  unless a post states otherwise

You **may not**:

- Reproduce full articles elsewhere without written permission
- Use name, brand, or image to suggest endorsement without permission

## Disclaimer

Content is provided "as is." We do not guarantee:

- Absolute technical accuracy (errors may exist)
- Up-to-dateness in older posts (tech moves fast)
- Fitness for any specific purpose

**We are not liable** for damages arising from use or inability to use the
content. Consult qualified professionals for decisions that impact your
business.

## Conduct

When commenting (via Giscus), you agree to:

- Not post illegal, offensive, defamatory, or spam content
- Respect GitHub's terms, which hosts the discussions

Comments may be moderated or removed at the author's discretion.

## External links

The site contains links to third-party services. We do not control or
take responsibility for the content of those sites.

## Changes

These terms may be updated. Significant changes will be flagged at the
top of the document.

## Governing law

These terms are governed by the laws of Brazil. Venue: Recife, PE, Brazil.

> **Note:** initial template. Review with your lawyer before treating as
> final.
```

- [ ] **Step 3: Commit**

```bash
git add content/pages/termos*
git commit -m "content: add terms of service templates (PT + EN)"
```

---

## Task 13: Privacy and terms pages

**Files:**
- Create: `app/(site)/privacidade/page.tsx`, `app/(site)/termos/page.tsx`
- Create: `app/(site)/en/privacy/page.tsx`, `app/(site)/en/terms/page.tsx`

- [ ] **Step 1: Create page files**

All four files follow the same pattern — just vary the slug lookup and
locale. Example for PT privacy:

`app/(site)/privacidade/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { pages } from "@/content";
import { MdxPage } from "@/features/blog/components/MdxPage";

type Page = {
  slug: string; locale: "pt" | "en"; title: string; description?: string; body: string;
};

export default function Page() {
  const page = (pages as unknown as Page[]).find(
    (p) => p.slug === "privacidade" && p.locale === "pt",
  );
  if (!page) notFound();
  return <MdxPage title={page.title} description={page.description} body={page.body} />;
}
```

Create analogous:
- `app/(site)/termos/page.tsx` — slug "termos", locale "pt"
- `app/(site)/en/privacy/page.tsx` — slug "privacidade", locale "en"
- `app/(site)/en/terms/page.tsx` — slug "termos", locale "en"

- [ ] **Step 2: Add footer links to privacy and terms**

Modify `components/layout/Footer.tsx` to include links:

```tsx
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SocialLinks } from "./SocialLinks";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  const l = locale as "pt" | "en";
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>{t("copyright", { year })}</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={institutionalRoutes.privacy[l]} className="hover:text-foreground">
            {locale === "pt" ? "Privacidade" : "Privacy"}
          </Link>
          <Link href={institutionalRoutes.terms[l]} className="hover:text-foreground">
            {locale === "pt" ? "Termos" : "Terms"}
          </Link>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent("consent:reopen"))}
          >
            {t("manageCookies")}
          </button>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
```

Note: `onClick` requires this to be a client component. Either convert
Footer to client, or extract the "Manage cookies" button to a small client
child. For simplicity, add `"use client";` at top and replace the async
Footer with a client version that receives the year/copyright as a
prop — or use `useLocale/useTranslations` client hooks. Example:

```tsx
"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { SocialLinks } from "./SocialLinks";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

export function Footer() {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>{t("copyright", { year })}</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={institutionalRoutes.privacy[locale]} className="hover:text-foreground">
            {locale === "pt" ? "Privacidade" : "Privacy"}
          </Link>
          <Link href={institutionalRoutes.terms[locale]} className="hover:text-foreground">
            {locale === "pt" ? "Termos" : "Terms"}
          </Link>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent("consent:reopen"))}
          >
            {t("manageCookies")}
          </button>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
```

SocialLinks may also need to become a pure component (no server data). It
already is.

- [ ] **Step 3: Commit**

```bash
git add app/ components/layout/Footer.tsx
git commit -m "feat: add privacy and terms pages with footer links and manage-cookies trigger"
```

---

## Task 14: End-to-end smoke test

- [ ] **Step 1: Start dev**

```bash
pnpm dev
```

- [ ] **Step 2: Manual checks**

Click through every route:

- [ ] `/` — Hero, Specialties, FeaturedProjects, LatestPosts, ContactCTA
- [ ] `/sobre` — bio + timeline
- [ ] `/portfolio` — grid with filters, 8 projects
- [ ] `/contato` — 6 social cards
- [ ] `/posts`, `/tags/meta`, `/2026/04/21/hello-world` (Phase 3)
- [ ] `/privacidade`, `/termos`
- [ ] All EN equivalents
- [ ] Filter by category on `/portfolio` — updates grid
- [ ] Filter by status on `/portfolio` — updates grid
- [ ] Social links in footer open in new tab

Stop dev.

- [ ] **Step 3: Full checks**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: all pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments after phase 4 smoke test" # skip if clean
```

---

## Task 15: Ensure LangToggle covers new routes

- [ ] **Step 1: Verify toggle works on all new pages**

Open each route and click PT/EN — should navigate to the correct sibling.
Note: the `routeMap` uses `institutionalRoutes`, already set up in Phase 1.
Posts and tags work via `swapLocale` fallback.

- [ ] **Step 2: Commit any adjustments**

If `swapLocale` needs an extra case (e.g., the new `privacidade` ↔
`privacy` pairing), ensure `institutionalRoutes` has entries for them
(already added in Phase 1 Task 6).

---

## Definition of Done — Phase 4

- [ ] `features/portfolio/data/projects.ts` has all 8 projects with
  bilingual excerpt/description/results
- [ ] `/portfolio` (PT and EN) renders a filterable grid
- [ ] `/sobre` and `/en/about` render MDX from `content/pages/`
- [ ] `/contato` and `/en/contact` show all 6 social links
- [ ] `/privacidade`, `/termos` and EN equivalents render LGPD template
- [ ] Home pages PT and EN assemble marketing blocks
- [ ] Footer links include Privacy, Terms, Manage cookies
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` pass
