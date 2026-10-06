import { Reveal } from "@/components/motion/Reveal";
import { Bot, MessageSquareText, ShieldCheck, Workflow } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const items = [
  {
    icon: Bot,
    pt: {
      title: "Agentes que executam",
      desc: "Um agente que executa o trabalho — não só responde perguntas.",
    },
    en: {
      title: "Agents that execute",
      desc: "An agent that does the work — not one that only answers questions.",
    },
  },
  {
    icon: Workflow,
    pt: {
      title: "Automação de processos",
      desc: "Integrações e rotinas que rodam sozinhas entre as ferramentas da empresa.",
    },
    en: {
      title: "Process automation",
      desc: "Integrations and routines that run on their own across your company's tools.",
    },
  },
  {
    icon: MessageSquareText,
    pt: {
      title: "IA dentro do seu produto",
      desc: "Um assistente que responde sobre os dados de cada cliente, dentro do sistema.",
    },
    en: {
      title: "AI inside your product",
      desc: "An assistant that answers about each customer's data, inside the system.",
    },
  },
  {
    icon: ShieldCheck,
    pt: {
      title: "Segurança e controle",
      desc: "Cada agente só acessa o que precisa, e a regra fica no servidor (não no texto do prompt).",
    },
    en: {
      title: "Security and control",
      desc: "Each agent only reaches what it needs, and the rule lives on the server (not in the prompt text).",
    },
  },
];

export function Specialties({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="font-heading mb-8 text-center text-3xl font-bold tracking-tight">
        {locale === "pt" ? "O que eu faço" : "What I do"}
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, ...it }, i) => (
          <Reveal
            key={it[locale].title}
            delay={i * 80}
            className="card-interactive rounded-lg border p-5"
          >
            <Icon className="text-primary h-5 w-5" />
            <h3 className="mt-3 font-sans font-semibold">{it[locale].title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {it[locale].desc}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
