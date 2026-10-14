import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hardenCookie } from "./env";

// Renova o access token (dura ~1h) antes de a página rodar, para a sessão não
// cair no meio do uso. É conforto, não trava: quem decide acesso é o
// requireAdmin, no servidor. Sem env configurada, só segue.
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers,
) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // O cookie renovado precisa ir na request (para a página ler o token
        // novo) e na response (para o browser guardar).
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, hardenCookie(options));
        }
        for (const [k, v] of Object.entries(headers)) {
          response.headers.set(k, v);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Auth fora do ar não derruba a página; o requireAdmin manda pro login.
  }
  return response;
}
