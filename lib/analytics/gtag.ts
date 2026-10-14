type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Envia um evento ao GA4. Não checa consentimento de propósito: `window.gtag`
 * só existe quando o script do GA foi renderizado, e isso só acontece com o
 * consentimento aceito e o ID do GA configurado. Sem isso, vira no-op.
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === "undefined") return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
