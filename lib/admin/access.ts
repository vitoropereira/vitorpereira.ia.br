import { ADMIN_SECTIONS, type AdminSection } from "./sections";

// Formato de ADMIN_ACCESS: `email:secao1|secao2,email2:*`. Entrada malformada
// é descartada em silêncio: na dúvida, nega. Recebe a env como parâmetro para
// os testes não dependerem de process.env.
export function parseAdminAccess(env: string | undefined) {
  const map = new Map<string, string[]>();
  for (const entry of (env ?? "").split(",")) {
    const sep = entry.indexOf(":");
    if (sep === -1) continue;
    const email = normalizeEmail(entry.slice(0, sep));
    const sections = entry
      .slice(sep + 1)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!email || sections.length === 0) continue;
    map.set(email, sections);
  }
  return map;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sectionsOf(email: string | undefined, env: string | undefined) {
  if (!email) return undefined;
  return parseAdminAccess(env).get(normalizeEmail(email));
}

export function isListed(email: string | undefined, env: string | undefined) {
  return sectionsOf(email, env) !== undefined;
}

export function canAccess(
  email: string | undefined,
  section: string,
  env: string | undefined,
) {
  const sections = sectionsOf(email, env);
  if (!sections) return false;
  return sections.includes("*") || sections.includes(section);
}

export function allowedSections(
  email: string | undefined,
  env: string | undefined,
): AdminSection[] {
  return ADMIN_SECTIONS.map((s) => s.slug).filter((slug) =>
    canAccess(email, slug, env),
  );
}
