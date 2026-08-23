"use client";

import { track } from "@vercel/analytics";

interface TrackedLinkProps {
  href: string;
  /** Nome do evento no Vercel Analytics — sem cookie, sem banner de consentimento. */
  event: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Âncora que registra o clique antes de navegar.
 *
 * Existe para responder, depois do evento, "quantas pessoas escanearam e o que
 * elas clicaram". Usa Vercel Analytics (já no root layout) em vez do GA porque
 * é cookieless — a página /card fica fora do grupo (site) e portanto sem o
 * banner de consentimento.
 */
export function TrackedLink({
  href,
  event,
  external = true,
  className,
  children,
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track("card_click", { target: event })}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
