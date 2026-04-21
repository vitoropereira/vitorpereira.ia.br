import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function ContactCTA({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="font-serif text-3xl font-bold tracking-tight">
        {locale === "pt" ? "Vamos conversar?" : "Let's talk?"}
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
        {locale === "pt"
          ? "Tem um projeto em mente, uma ideia de SaaS, ou só quer trocar ideia? Me chama."
          : "Got a project in mind, a SaaS idea, or just want to chat? Reach out."}
      </p>
      <Link
        href={institutionalRoutes.contact[locale]}
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        {locale === "pt" ? "Entrar em contato" : "Get in touch"}
      </Link>
    </section>
  );
}
