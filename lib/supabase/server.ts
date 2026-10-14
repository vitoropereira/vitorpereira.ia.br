import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hardenCookie, supabaseAuthEnv } from "./env";

// Um cliente por request: o @supabase/ssr manda os headers de no-cache só na
// primeira gravação de cookie de cada cliente.
export async function createClient() {
  const { url, key } = supabaseAuthEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, hardenCookie(options));
          }
        } catch {
          // Server Component não grava cookie. A renovação da sessão fica com
          // o proxy (lib/supabase/proxy.ts); aqui basta ler.
        }
      },
    },
  });
}
