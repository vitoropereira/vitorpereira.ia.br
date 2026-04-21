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

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
