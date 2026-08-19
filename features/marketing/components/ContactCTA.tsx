import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
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
      <Link
        href={institutionalRoutes.contact[locale]}
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        {locale === "pt" ? "Conversar sobre um processo" : "Discuss a workflow"}
      </Link>
    </section>
  );
}
