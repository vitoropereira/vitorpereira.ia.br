import { readConsent } from "@/lib/consent";

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Envia um evento ao GA4. `window.gtag` só existe quando o script do GA foi
 * renderizado (consentimento aceito + ID configurado), mas ele continua
 * definido na página depois que o usuário retira o consentimento sem recarregar.
 * Por isso relemos o cookie a cada chamada: sem "accepted", vira no-op e o GA
 * não regrava os cookies que acabamos de apagar.
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === "undefined") return;
  if (readConsent() !== "accepted") return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
