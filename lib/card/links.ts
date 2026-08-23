/**
 * Links do cartão de visita digital (/card).
 *
 * Dados puros de propósito: o mapeamento id → componente de ícone acontece na
 * página, para este módulo continuar importável por rota de API e por teste sem
 * arrastar React junto.
 */

import { siteConfig } from "@/lib/siteConfig";

export type CardLinkId =
  | "linkedin"
  | "github"
  | "instagram"
  | "x"
  | "youtube"
  | "tabnews";

export interface CardLink {
  id: CardLinkId;
  label: string;
  /** Uma linha sobre o que a pessoa encontra ali. */
  description: string;
  href: string;
}

/** Ordem = prioridade de leitura no celular. LinkedIn primeiro: é evento. */
export const cardLinks: readonly CardLink[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Onde eu respondo mais rápido",
    href: siteConfig.social.linkedin,
  },
  {
    id: "github",
    label: "GitHub",
    description: "Código e experimentos",
    href: siteConfig.social.github,
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "IA aplicada, na prática",
    href: siteConfig.social.youtube,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Bastidores do dia a dia",
    href: siteConfig.social.instagram,
  },
  {
    id: "x",
    label: "X",
    description: "Ideias soltas sobre agentes",
    href: siteConfig.social.x,
  },
  {
    id: "tabnews",
    label: "TabNews",
    description: "Artigos na comunidade dev",
    href: siteConfig.social.tabnews,
  },
];

/** Páginas do próprio site linkadas no rodapé do cartão. */
export const cardSiteLinks = [
  { label: "Agente operacional", href: "/servicos/agente-operacional" },
  { label: "Posts", href: "/posts" },
  { label: "Sobre mim", href: "/sobre" },
] as const;

/** URLs que entram no vCard: o site primeiro, depois os perfis. */
export function vCardUrls(): string[] {
  return [siteConfig.url, ...cardLinks.map((link) => link.href)];
}
