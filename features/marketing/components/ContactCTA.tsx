import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function ContactCTA({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        {locale === "pt"
          ? "Tem um processo repetitivo que vive quebrando?"
          : "Do you have a repetitive workflow that keeps breaking?"}
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
        {locale === "pt"
          ? "Me mostra o fluxo atual, as ferramentas e onde o trabalho trava. A conversa começa decidindo se um agente resolve ou só adiciona complexidade."
          : "Show me the current flow, the tools involved, and where work gets stuck. We start by deciding whether an agent helps or merely adds complexity."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={siteConfig.booking.routes.diagnostic[locale]}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          {locale === "pt"
            ? "Agendar diagnóstico de 30 min"
            : "Book a 30-min diagnostic"}
        </Link>
        <Link
          href={institutionalRoutes.contact[locale]}
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          {locale === "pt" ? "Outros canais" : "Other channels"}
        </Link>
      </div>
      <p className="text-muted-foreground mt-3 text-sm">
        {locale === "pt"
          ? "Sem custo e sem compromisso."
          : "Free, no strings attached."}
      </p>
    </section>
  );
}
