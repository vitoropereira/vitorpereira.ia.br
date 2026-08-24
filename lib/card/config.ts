/**
 * Cartão de visita digital (/card) — fonte única dos dados pessoais expostos.
 *
 * A página se degrada sozinha em vez de mostrar dado inventado: sem número, o
 * botão do WhatsApp não é renderizado e o vCard sai sem TEL; com `orgs` vazio,
 * o vCard sai sem ORG.
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
   * Telefone em E.164 sem o "+". `null` mantém o botão do WhatsApp fora da
   * página e o vCard sem TEL, em vez de renderizar link quebrado.
   */
  whatsapp: string | null;
  /** Mensagem pré-preenchida ao abrir a conversa. */
  whatsappPrefill: string;
  /**
   * E-mail exibido na página e gravado no vCard. Endereço do domínio, servido
   * por Cloudflare Email Routing (ver docs/card/README.md) — encaminha para a
   * caixa pessoal sem expô-la numa página pública ligada a QR.
   */
  email: string;
}

export const cardIdentity: CardIdentity = {
  fullName: "Vitor Onofre Pereira",
  givenName: "Vitor",
  familyName: "Onofre Pereira",
  // Confirmado pelo Vitor. Vai no TITLE do vCard — é a linha que aparece
  // embaixo do nome na agenda de quem salva o contato.
  role: "Engenheiro de software — IA aplicada",
  // Opcional, e vazio de propósito: cartão pessoal não precisa carregar
  // as empresas. Preencher aqui adiciona a linha ORG ao vCard.
  orgs: [],
  tagline: "IA aplicada em sistemas reais.",
};

export const cardContact: CardContactChannels = {
  // Confirmado pelo Vitor (mesmo número publicado em masterclass.vitorpereira.ia.br).
  whatsapp: "5581996733973",
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
