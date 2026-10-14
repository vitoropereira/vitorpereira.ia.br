// Catálogo das seções do /admin. Seção nova = entrada aqui + página que chama
// `requireAdmin("<slug>")`; a lista de permitidos (ADMIN_ACCESS) só referencia
// estes slugs.
export const ADMIN_SECTIONS = [
  { slug: "redes", label: "Redes sociais", href: "/admin/redes" },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number]["slug"];
