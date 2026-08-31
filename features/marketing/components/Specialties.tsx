import { Bot, MessageSquareText, ShieldCheck, Workflow } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const items = [
  {
    icon: Bot,
    pt: {
      title: "Agentes de IA autônomos",
      desc: "Agentes que executam trabalho em produção — não só respondem.",
    },
    en: {
      title: "Autonomous AI agents",
      desc: "Agents that get work done in production — not just answer.",
    },
  },
  {
    icon: Workflow,
    pt: {
      title: "Automação & orquestração",
      desc: "n8n, webhooks, filas e integrações que rodam sozinhas.",
    },
    en: {
      title: "Automation & orchestration",
      desc: "n8n, webhooks, queues, and integrations that run on their own.",
    },
  },
  {
    icon: MessageSquareText,
    pt: {
      title: "Copilotos / IA in-product",
      desc: "IA dentro do produto, respondendo sobre os dados de cada cliente.",
    },
    en: {
      title: "Copilots / in-product AI",
      desc: "AI inside the product, answering over each client's data.",
    },
  },
  {
    icon: ShieldCheck,
    pt: {
      title: "Segurança de agentes & dados",
      desc: "Guardrails, RLS e permissões — a fronteira fica no servidor.",
    },
    en: {
      title: "Agent & data security",
      desc: "Guardrails, RLS, and permissions — the boundary lives on the server.",
    },
  },
];

export function Specialties({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="mb-8 text-center font-heading text-3xl font-bold tracking-tight">
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
