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
      ? "I design and deploy agents that execute real workflows inside the tools your company already uses — with logs, rules, human approval, and documentation."
      : "Eu projeto e implanto agentes que executam processos reais dentro das ferramentas que sua empresa já usa — com logs, regras, aprovação humana e documentação.";
  const headline =
    locale === "en"
      ? { lead: "Applied AI in ", accent: "real systems" }
      : { lead: "IA aplicada em ", accent: "sistemas reais" };

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
        vitor pereira
      </p>
      <h1 className="mt-6 font-mono text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
        {headline.lead}
        <span className="text-primary">{headline.accent}</span>.
      </h1>
      <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
        {pitch}
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={r("operationalAgent")}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          {locale === "en"
            ? "Explore the Operational AI Agent"
            : "Conhecer o Agente Operacional"}
        </Link>
        <Link
          href="#casos"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          {locale === "en" ? "See real cases" : "Ver casos reais"}
        </Link>
      </div>
    </section>
  );
}
