import Link from "next/link";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ locale }: { locale: Locale }) {
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale as "pt" | "en"];
  const pitch =
    locale === "en"
      ? "No hype, no fake demos. Code, automation, and products that actually work — shown by the person who builds them."
      : "Sem hype, sem demo fake. Código, automação e produto funcionando de verdade — mostrados por quem constrói.";

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
        vitor pereira
      </p>
      <h1 className="font-mono mt-6 text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
        IA aplicada em <span className="text-brand">sistemas reais</span>.
      </h1>
      <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
        {pitch}
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={r("portfolio")} className={cn(buttonVariants({ size: "lg" }))}>
          {locale === "en" ? "See the projects" : "Ver os projetos"}
        </Link>
        <Link
          href={r("postsList")}
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          {locale === "en" ? "Read the blog" : "Ler o blog"}
        </Link>
      </div>
    </section>
  );
}
