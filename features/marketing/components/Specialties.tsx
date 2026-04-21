import { Bot, Cpu, Layers, Workflow } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const items = [
  {
    icon: Bot,
    pt: {
      title: "Produtos com IA",
      desc: "LLMs, agentes, RAG, automação inteligente aplicada a negócios.",
    },
    en: {
      title: "AI products",
      desc: "LLMs, agents, RAG, intelligent automation applied to business.",
    },
  },
  {
    icon: Workflow,
    pt: {
      title: "Automação & SaaS",
      desc: "N8N, integrações, Micro-SaaS escaláveis e eficientes.",
    },
    en: {
      title: "Automation & SaaS",
      desc: "N8N, integrations, scalable and efficient Micro-SaaS.",
    },
  },
  {
    icon: Layers,
    pt: {
      title: "Full-Stack moderno",
      desc: "React, Next.js, Node.js, TypeScript end-to-end.",
    },
    en: {
      title: "Modern full-stack",
      desc: "React, Next.js, Node.js, TypeScript end-to-end.",
    },
  },
  {
    icon: Cpu,
    pt: {
      title: "Análise de dados",
      desc: "OCR, NLP, pipelines para insights acionáveis.",
    },
    en: {
      title: "Data analysis",
      desc: "OCR, NLP, pipelines for actionable insights.",
    },
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
            <Icon className="text-primary h-5 w-5" />
            <h3 className="mt-3 font-sans font-semibold">{it[locale].title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {it[locale].desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
