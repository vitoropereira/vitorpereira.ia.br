import type { Locale } from "@/lib/i18n/config";

/**
 * Catálogo de serviços agendáveis.
 *
 * `calSlug` é o slug do event type no Cal.com (perfil `siteConfig.booking.handle`).
 * O slug da rota no site é o mesmo, para o link ficar previsível nos dois lados.
 */
export type BookingService = {
  slug: string;
  calSlug: string;
  durationMinutes: number;
  /** Preço em BRL. `null` = gratuito. */
  priceBRL: number | null;
  /** Preço é piso, não valor fechado — muda a copy para "a partir de". */
  priceFrom?: boolean;
  /** Destaque na listagem: a porta de entrada do funil. */
  featured?: boolean;
  pt: { name: string; summary: string };
  en: { name: string; summary: string };
};

export const bookingServices: BookingService[] = [
  {
    slug: "diagnostico-30min",
    calSlug: "diagnostico-30min",
    durationMinutes: 30,
    priceBRL: null,
    featured: true,
    pt: {
      name: "Diagnóstico de Automação com IA",
      summary:
        "Trinta minutos para olhar um processo da sua operação e responder o que dá para automatizar hoje, o que ainda não vale a pena e qual seria o caminho técnico.",
    },
    en: {
      name: "AI Automation Diagnostic",
      summary:
        "Thirty minutes to look at one workflow in your operation and answer what can be automated today, what is not worth it yet, and what the technical path would be.",
    },
  },
  {
    slug: "escopo-software-30-dias",
    calSlug: "escopo-software-30-dias",
    durationMinutes: 60,
    priceBRL: 20000,
    priceFrom: true,
    pt: {
      name: "Software Operacional com IA em 30 dias",
      summary:
        "Uma hora para mapear o processo, desenhar a solução e definir a métrica que prova o resultado. É desta conversa que sai o orçamento fechado. Nada é cobrado no agendamento.",
    },
    en: {
      name: "Operational AI Software in 30 days",
      summary:
        "One hour to map the workflow, design the solution, and define the metric that proves the result. The fixed quote comes out of this conversation. Nothing is charged at booking.",
    },
  },
  {
    slug: "agente-pessoal",
    calSlug: "agente-pessoal",
    durationMinutes: 60,
    priceBRL: 3500,
    pt: {
      name: "Agente Pessoal — assistente 24/7",
      summary:
        "Implantação de um agente com memória própria, que vive no WhatsApp ou no Telegram e continua trabalhando quando você está offline. Escopo fechado, até 14 dias.",
    },
    en: {
      name: "Personal Agent — your 24/7 assistant",
      summary:
        "Deployment of an agent with its own memory, living in WhatsApp or Telegram and working while you are offline. Fixed scope, up to 14 days.",
    },
  },
  {
    slug: "revisao-arquitetura",
    calSlug: "revisao-arquitetura",
    durationMinutes: 120,
    priceBRL: 1200,
    pt: {
      name: "Revisão de arquitetura e stack",
      summary:
        "Análise técnica do seu sistema antes de escalar, contratar time ou reescrever. Inclui parecer escrito com os achados priorizados por severidade.",
    },
    en: {
      name: "Architecture and stack review",
      summary:
        "Technical analysis of your system before scaling, hiring, or rewriting. Includes a written report with findings ranked by severity.",
    },
  },
  {
    slug: "consultoria-tecnica",
    calSlug: "consultoria-tecnica",
    durationMinutes: 60,
    priceBRL: 500,
    pt: {
      name: "Consultoria técnica 1:1",
      summary:
        "Uma hora para destravar um problema técnico específico: integração que não fecha, arquitetura de agente, saída do n8n para código, RLS, WhatsApp API.",
    },
    en: {
      name: "1:1 technical consulting",
      summary:
        "One hour to unblock a specific technical problem: an integration that will not close, agent architecture, moving from n8n to code, RLS, WhatsApp API.",
    },
  },
  {
    slug: "mentoria",
    calSlug: "mentoria",
    durationMinutes: 60,
    priceBRL: 450,
    pt: {
      name: "Mentoria 1:1 — Engenharia com IA",
      summary:
        "Acompanhamento para quem quer parar de usar IA como autocomplete e passar a construir sistema com ela. Você traz código real, não exercício de aula.",
    },
    en: {
      name: "1:1 mentoring — Engineering with AI",
      summary:
        "For developers who want to stop using AI as autocomplete and start building systems with it. You bring real code, not classroom exercises.",
    },
  },
];

export function getBookingService(slug: string): BookingService | undefined {
  return bookingServices.find((service) => service.slug === slug);
}

export function formatPrice(service: BookingService, locale: Locale): string {
  if (service.priceBRL === null) return locale === "pt" ? "Grátis" : "Free";
  // O valor é sempre em real, mas o separador segue o idioma de quem lê:
  // "R$ 20.000" para o leitor pt-BR e "R$ 20,000" para o de en-US — que leria
  // o ponto como decimal, ou seja, vinte reais.
  const value = service.priceBRL.toLocaleString(
    locale === "pt" ? "pt-BR" : "en-US",
  );
  const prefix = locale === "pt" ? "A partir de " : "From ";
  return `${service.priceFrom ? prefix : ""}R$ ${value}`;
}

export function formatDuration(
  service: BookingService,
  locale: Locale,
): string {
  const { durationMinutes } = service;
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = Math.floor(durationMinutes / 60);
  const rest = durationMinutes % 60;
  // 90 min vira "1h30", não "1.5 horas" — que além de feio usa o separador
  // decimal errado em pt-BR.
  if (rest > 0) return `${hours}h${String(rest).padStart(2, "0")}`;
  if (locale === "pt") return hours === 1 ? "1 hora" : `${hours} horas`;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}
