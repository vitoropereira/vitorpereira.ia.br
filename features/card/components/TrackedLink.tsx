"use client";

import { trackEvent } from "@/lib/analytics/gtag";

interface TrackedLinkProps {
  href: string;
  /** Alvo do clique, enviado como parâmetro `target` do evento `card_click`. */
  event: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Âncora que registra o clique antes de navegar.
 *
 * Envia `card_click` ao GA4 via `trackEvent`. A página /card fica fora do
 * grupo (site): sem GA e sem banner de consentimento, então lá o evento é
 * no-op e o clique não é medido. Só mede se o GA estiver carregado.
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
      onClick={() => trackEvent("card_click", { target: event })}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
