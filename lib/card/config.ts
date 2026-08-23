/**
 * Cartão de visita digital (/card) — fonte única dos dados pessoais expostos.
 *
 * ⚠️ Os campos marcados com PREENCHER são os únicos que precisam de input do
 * Vitor. A página se degrada sozinha: `whatsapp: null` esconde o botão do
 * WhatsApp em vez de renderizar um link quebrado.
 */

export interface CardIdentity {
  /** Nome completo, como vai cair na agenda de quem salvar o contato. */
  fullName: string;
  /** Primeiro nome + sobrenome, para o campo N: estruturado do vCard. */
  givenName: string;
  familyName: string;
  /** Uma linha, exibida sob o nome na página e no TITLE do vCard. */
  role: string;
  /** Organizações no vCard (ORG). Vazio = campo omitido. */
  orgs: readonly string[];
  /** Frase curta na página — o posicionamento, não o cargo. */
  tagline: string;
}

export interface CardContactChannels {
  /**
   * PREENCHER — telefone em E.164 sem o "+", ex.: "5541999998888".
   * `null` mantém o botão do WhatsApp fora da página.
   */
  whatsapp: string | null;
  /** Mensagem pré-preenchida ao abrir a conversa. */
  whatsappPrefill: string;
  /**
   * E-mail exibido. Trocar para contato@vitorpereira.ia.br assim que o
   * Cloudflare Email Routing estiver verificado (ver docs/card/README.md).
   */
  email: string;
}

export const cardIdentity: CardIdentity = {
  fullName: "Vitor Onofre Pereira",
  givenName: "Vitor",
  familyName: "Onofre Pereira",
  // PREENCHER — confirmar como o Vitor quer aparecer na agenda dos outros.
  role: "Engenheiro de software — IA aplicada",
  // PREENCHER — confirmar quais organizações expor neste cartão pessoal.
  orgs: [],
  tagline: "IA aplicada em sistemas reais.",
};

export const cardContact: CardContactChannels = {
  // PREENCHER — sem isso o botão do WhatsApp não é renderizado.
  whatsapp: null,
  whatsappPrefill: "Oi Vitor! Te conheci no Startup Summit.",
  email: "contato@vitorpereira.ia.br",
};

/** Monta o link do WhatsApp, ou null se o número não estiver configurado. */
export function whatsappUrl(contact: CardContactChannels): string | null {
  if (!contact.whatsapp) return null;
  const digits = contact.whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const text = encodeURIComponent(contact.whatsappPrefill);
  return `https://wa.me/${digits}?text=${text}`;
}
