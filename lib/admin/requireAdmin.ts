import { forbidden, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allowedSections, canAccess, isListed, normalizeEmail } from "./access";
import type { AdminSection } from "./sections";

export type Admin = { email: string; sections: AdminSection[] };

type Check =
  | { ok: true; admin: Admin }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

async function check(section?: AdminSection): Promise<Check> {
  // getUser valida o token no Auth; getSession só decodifica o cookie, que o
  // cliente pode forjar. Sem env ou Auth fora do ar conta como sem sessão:
  // manda pro login (que também tolera isso) em vez de estourar 500.
  let email: string | undefined;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) email = data?.user?.email;
  } catch {
    email = undefined;
  }
  if (!email) return { ok: false, reason: "unauthenticated" };

  const env = process.env.ADMIN_ACCESS;
  const allowed = section
    ? canAccess(email, section, env)
    : isListed(email, env);
  if (!allowed) return { ok: false, reason: "forbidden" };

  return {
    ok: true,
    admin: {
      email: normalizeEmail(email),
      sections: allowedSections(email, env),
    },
  };
}

// Toda página de /admin (menos o login) chama isto antes de qualquer dado.
// Sem seção, basta estar na lista com qualquer seção.
export async function requireAdmin(section?: AdminSection): Promise<Admin> {
  const result = await check(section);
  if (!result.ok) {
    if (result.reason === "unauthenticated") redirect("/admin/login");
    forbidden();
  }
  return result.admin;
}

// Route handler não pode lançar redirect/forbidden; devolve a Response pronta.
export async function requireAdminApi(
  section?: AdminSection,
): Promise<Admin | Response> {
  const result = await check(section);
  if (result.ok) return result.admin;
  return result.reason === "unauthenticated"
    ? Response.json({ error: "unauthorized" }, { status: 401 })
    : Response.json({ error: "forbidden" }, { status: 403 });
}
