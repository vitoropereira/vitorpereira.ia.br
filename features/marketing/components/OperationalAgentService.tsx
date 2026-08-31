import Link from "next/link";
import { CheckCircle2, ShieldCheck, Workflow, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { bookingRoutes } from "@/features/booking/routes";
import { formatPrice, getBookingService } from "@/features/booking/services";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const copy = {
  pt: {
    eyebrow: "agente operacional de IA",
    title: "Um processo real. Um agente responsável por executá-lo.",
    intro:
      "Eu desenho e implanto um agente dentro das ferramentas que sua empresa já usa. Ele recebe uma tarefa clara, consulta os dados permitidos, executa o fluxo e deixa rastro do que fez.",
    methodLabel: "método de implantação",
    method: "Map → Evaluate → Deploy → Operate",
    methodText:
      "Primeiro mapeamos o processo e os limites. Depois construímos avaliações, colocamos uma fatia em produção e operamos com dados reais antes de ampliar a autonomia.",
    deliverableTitle: "O que entra",
    deliverables: [
      "Um processo delimitado, com entrada, saída e dono definidos.",
      "Integrações com as ferramentas necessárias para esse processo.",
      "Logs, regras e aprovação humana nas ações de maior impacto.",
      "Critérios de avaliação para resultado, trajeto, segurança e custo.",
      "Documentação do fluxo, acessos, limites e rotina de operação.",
    ],
    controlsTitle: "Autonomia sem acesso irrestrito",
    controls:
      "A fronteira fica no servidor, não no prompt. O agente recebe só as permissões necessárias, falha de forma visível e pede decisão humana quando a ação é irreversível ou foge do contrato.",
    fitTitle: "Faz sentido quando",
    fit: [
      "o processo já existe e consome trabalho recorrente;",
      "as fontes de dados e ferramentas podem ser acessadas por API;",
      "o resultado pode ser verificado por regra ou por uma pessoa responsável.",
    ],
    noFitTitle: "Não faz sentido quando",
    noFit: [
      "o processo muda toda semana e ninguém sabe qual é a saída correta;",
      "a única expectativa é substituir uma equipe inteira no primeiro dia;",
      "não existe responsável humano pelo resultado do sistema.",
    ],
    investmentLabel: "investimento",
    investmentText:
      "Escopo fechado de 21 a 30 dias. Projeto que vira software e painel maior fica na faixa de R$ 40.000, e a sustentação mensal é opcional, a partir de R$ 2.000. O número exato sai do diagnóstico de escopo — que já está incluído e não é cobrado à parte.",
    ctaTitle: "Tem um processo assim dentro da empresa?",
    ctaText:
      "Traga o fluxo atual, as ferramentas envolvidas e onde ele costuma quebrar. A primeira conversa serve para decidir se um agente ajuda ou só adiciona complexidade.",
    cta: "Agendar diagnóstico de escopo",
    ctaNote: "1 hora, online. Nada é cobrado no agendamento.",
    ctaSecondary: "Prefiro outro canal",
  },
  en: {
    eyebrow: "operational AI agent",
    title: "One real workflow. One agent responsible for executing it.",
    intro:
      "I design and deploy an agent inside the tools your company already uses. It receives a clear task, accesses only the allowed data, executes the workflow, and leaves an audit trail.",
    methodLabel: "deployment method",
    method: "Map → Evaluate → Deploy → Operate",
    methodText:
      "We map the workflow and its boundaries first. Then we build evaluations, put one thin slice in production, and operate with real data before expanding autonomy.",
    deliverableTitle: "What is included",
    deliverables: [
      "One bounded workflow with a defined input, output, and owner.",
      "Integrations with the tools required by that workflow.",
      "Logs, rules, and human approval for high-impact actions.",
      "Evaluation criteria for outcome, path, security, and cost.",
      "Documentation for the workflow, access, limits, and operations.",
    ],
    controlsTitle: "Autonomy without unrestricted access",
    controls:
      "The boundary lives on the server, not in the prompt. The agent gets only the permissions it needs, fails visibly, and asks for a human decision when an action is irreversible or outside its contract.",
    fitTitle: "A good fit when",
    fit: [
      "the workflow already exists and consumes recurring work;",
      "its data sources and tools are accessible through APIs;",
      "the result can be verified by a rule or an accountable person.",
    ],
    noFitTitle: "Not a good fit when",
    noFit: [
      "the workflow changes every week and nobody knows the correct output;",
      "the expectation is to replace an entire team on day one;",
      "no human is accountable for the system's outcome.",
    ],
    investmentLabel: "investment",
    investmentText:
      "Fixed scope, 21 to 30 days. Projects that grow into a larger system and dashboard sit around R$ 40,000, and monthly support is optional, from R$ 2,000. The exact number comes out of the scoping session — already included, never billed separately.",
    ctaTitle: "Do you have a workflow like this?",
    ctaText:
      "Bring the current flow, the tools involved, and where it usually breaks. The first conversation is for deciding whether an agent helps or merely adds complexity.",
    cta: "Book a scoping session",
    ctaNote: "One hour, online. Nothing is charged at booking.",
    ctaSecondary: "I prefer another channel",
  },
} as const;

export function OperationalAgentService({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const contact = institutionalRoutes.contact[locale];
  // Preço vem do catálogo de agendamento: o mesmo serviço não pode mostrar um
  // número aqui e outro em /agendar.
  const service = getBookingService("escopo-software-30-dias");
  const investmentTitle = service ? formatPrice(service, locale) : "";

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <p className="text-primary font-mono text-sm tracking-widest uppercase">
          {text.eyebrow}
        </p>
        <h1 className="font-heading mt-5 max-w-4xl text-4xl leading-tight font-bold tracking-tight md:text-6xl">
          {text.title}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-3xl text-lg md:text-xl">
          {text.intro}
        </p>
        <Link
          href={bookingRoutes.operationalAgent(locale)}
          className={cn(buttonVariants({ size: "lg" }), "mt-8")}
        >
          {text.cta}
        </Link>
      </section>

      <section className="border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              {text.methodLabel}
            </p>
            <p className="text-primary mt-3 font-mono text-xl font-semibold">
              {text.method}
            </p>
            <p className="text-muted-foreground mt-4">{text.methodText}</p>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold">
              {text.deliverableTitle}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {text.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-lg border p-4 text-sm"
                >
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="bg-muted/40 rounded-xl border p-6 md:p-8">
          <ShieldCheck className="text-primary size-6" />
          <h2 className="font-heading mt-4 text-3xl font-bold">
            {text.controlsTitle}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl">
            {text.controls}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <Workflow className="text-primary size-5" />
            <h2 className="font-heading mt-3 text-2xl font-bold">
              {text.fitTitle}
            </h2>
            <ul className="text-muted-foreground mt-4 space-y-3">
              {text.fit.map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-1 size-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <XCircle className="text-muted-foreground size-5" />
            <h2 className="font-heading mt-3 text-2xl font-bold">
              {text.noFitTitle}
            </h2>
            <ul className="text-muted-foreground mt-4 space-y-3">
              {text.noFit.map((item) => (
                <li key={item} className="flex gap-3">
                  <XCircle className="mt-1 size-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-primary font-mono text-sm tracking-widest uppercase">
            {text.investmentLabel}
          </p>
          <h2 className="font-heading mt-4 text-3xl font-bold">
            {investmentTitle}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl">
            {text.investmentText}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-heading text-3xl font-bold">{text.ctaTitle}</h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
          {text.ctaText}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={bookingRoutes.operationalAgent(locale)}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {text.cta}
          </Link>
          <Link
            href={contact}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            {text.ctaSecondary}
          </Link>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">{text.ctaNote}</p>
      </section>
    </>
  );
}
