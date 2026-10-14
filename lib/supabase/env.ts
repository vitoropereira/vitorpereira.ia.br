// URL e chave pública (anon ou publishable) do Supabase Auth. Lança cedo e
// com nome da env: sem isso o erro aparece lá no fundo do @supabase/ssr.
export function supabaseAuthEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Auth sem configuração: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url, key };
}

// O /admin só fala com o Auth pelo servidor, nunca por cliente de browser.
// Por isso o cookie de sessão pode (e deve) ser httpOnly, fora do alcance de
// qualquer script da página.
export function hardenCookie<T extends object | undefined>(options: T) {
  return { ...options, httpOnly: true, sameSite: "lax" as const };
}
