import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

// O header precisa ir na REQUEST: o `headers()` de i18n/request.ts lê a
// request, e um header setado na response nunca chega lá (locale caía em PT).
function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocalePrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (!hasLocalePrefix && pathname === "/") {
    // First visit — detect from Accept-Language if no cookie set
    if (cookieLocale === "en") {
      return NextResponse.redirect(new URL("/en", request.url), 307);
    }
    if (!cookieLocale) {
      const accept = request.headers.get("accept-language") ?? "";
      const prefersEn = /^en\b/i.test(accept) || /[,;]\s*en\b/i.test(accept);
      if (prefersEn && !accept.toLowerCase().startsWith("pt")) {
        const res = NextResponse.redirect(new URL("/en", request.url), 307);
        res.cookies.set("NEXT_LOCALE", "en", {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
        return res;
      }
      const res = nextWithPathname(request);
      res.cookies.set("NEXT_LOCALE", defaultLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }
  }

  return nextWithPathname(request);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
