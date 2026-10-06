import type { Locale } from "@/lib/i18n/config";

// Cenários fictícios e genéricos: servem para o gestor de qualquer ramo se
// reconhecer. Nunca usar o fluxo de uma empresa real do Vitor aqui.
export type LogKind = "input" | "read" | "alert" | "human" | "done";
export type LogLine = { time: string; kind: LogKind; text: string };
export type Scenario = { agent: string; lines: LogLine[] };

export const agentLogScenarios: Record<Locale, Scenario[]> = {
  pt: [
    {
      agent: "agente-financeiro",
      lines: [
        {
          time: "09:14:02",
          kind: "input",
          text: "nota fiscal recebida por e-mail",
        },
        {
          time: "09:14:03",
          kind: "read",
          text: "valores conferidos com o pedido",
        },
        {
          time: "09:14:03",
          kind: "alert",
          text: "divergência de R$ 312,00 no frete",
        },
        {
          time: "09:14:04",
          kind: "human",
          text: "aguardando aprovação → Ana (financeiro)",
        },
        {
          time: "09:16:40",
          kind: "done",
          text: "aprovado por Ana — lançamento feito",
        },
      ],
    },
    {
      agent: "agente-atendimento",
      lines: [
        { time: "10:02:11", kind: "input", text: "mensagem nova no WhatsApp" },
        { time: "10:02:12", kind: "read", text: "pedido #4812 identificado" },
        {
          time: "10:02:12",
          kind: "read",
          text: "status conferido no sistema: em separação",
        },
        { time: "10:02:13", kind: "done", text: "resposta enviada ao cliente" },
      ],
    },
    {
      agent: "agente-operacao",
      lines: [
        { time: "14:30:00", kind: "input", text: "planilha nova no Drive" },
        { time: "14:30:04", kind: "read", text: "214 linhas validadas" },
        { time: "14:30:04", kind: "alert", text: "3 linhas com CNPJ inválido" },
        {
          time: "14:30:05",
          kind: "human",
          text: "3 linhas aguardam decisão → Bruno (operações)",
        },
        { time: "14:30:05", kind: "done", text: "211 linhas importadas" },
      ],
    },
  ],
  en: [
    {
      agent: "finance-agent",
      lines: [
        { time: "09:14:02", kind: "input", text: "invoice received by email" },
        {
          time: "09:14:03",
          kind: "read",
          text: "amounts checked against the order",
        },
        {
          time: "09:14:03",
          kind: "alert",
          text: "R$ 312.00 mismatch on shipping",
        },
        {
          time: "09:14:04",
          kind: "human",
          text: "waiting for approval → Ana (finance)",
        },
        {
          time: "09:16:40",
          kind: "done",
          text: "approved by Ana — entry posted",
        },
      ],
    },
    {
      agent: "support-agent",
      lines: [
        { time: "10:02:11", kind: "input", text: "new WhatsApp message" },
        { time: "10:02:12", kind: "read", text: "order #4812 identified" },
        {
          time: "10:02:12",
          kind: "read",
          text: "status checked in the system: being packed",
        },
        { time: "10:02:13", kind: "done", text: "reply sent to the customer" },
      ],
    },
    {
      agent: "ops-agent",
      lines: [
        { time: "14:30:00", kind: "input", text: "new spreadsheet in Drive" },
        { time: "14:30:04", kind: "read", text: "214 rows validated" },
        {
          time: "14:30:04",
          kind: "alert",
          text: "3 rows with an invalid tax ID",
        },
        {
          time: "14:30:05",
          kind: "human",
          text: "3 rows waiting for a decision → Bruno (operations)",
        },
        { time: "14:30:05", kind: "done", text: "211 rows imported" },
      ],
    },
  ],
};
