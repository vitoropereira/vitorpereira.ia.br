import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Liga o forbidden() de next/navigation: é o que faz uma página do /admin
  // responder 403 de verdade em vez de 200 com "acesso negado".
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
