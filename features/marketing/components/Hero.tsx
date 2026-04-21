import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
      <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
        {siteConfig.tagline[locale]}
      </p>
    </section>
  );
}
