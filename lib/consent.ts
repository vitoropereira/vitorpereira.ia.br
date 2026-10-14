export type ConsentValue = "accepted" | "rejected";

const COOKIE_NAME = "consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=(accepted|rejected)`),
  );
  return (match?.[1] as ConsentValue) ?? null;
}

export function writeConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

const ANALYTICS_COOKIE = /^(_ga|_ga_.*|_gid|_gat.*|_gac_.*|_clck|_clsk)$/;

// Retirar o consentimento tem que parar a coleta, não só impedir a próxima
// carga: apagamos os cookies que GA e Clarity já gravaram. O GA grava no
// domínio-pai (.dominio), então expiramos com e sem `domain`.
export function clearAnalyticsCookies(): void {
  if (typeof document === "undefined") return;
  // Todos os sufixos do host: o GA escolhe o domínio-pai mais curto que o
  // navegador aceita (em vitorpereira.ia.br, ".ia.br" é rejeitado), então
  // não dá para presumir "últimos dois rótulos".
  const parts = location.hostname.split(".");
  const domains: (string | undefined)[] = [undefined, location.hostname];
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`.${parts.slice(i).join(".")}`);
  }

  for (const entry of document.cookie.split(";")) {
    const name = entry.trim().split("=")[0];
    if (!name || !ANALYTICS_COOKIE.test(name)) continue;
    for (const domain of domains) {
      const domainAttr = domain ? `; domain=${domain}` : "";
      document.cookie = `${name}=; path=/${domainAttr}; max-age=0; SameSite=Lax`;
    }
  }
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
