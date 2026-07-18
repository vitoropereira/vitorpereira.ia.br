import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function ContactCTA({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        {locale === "pt" ? "Vamos trocar ideia?" : "Let's connect?"}
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
        {locale === "pt"
          ? "Eu publico o que aprendo sobre IA aplicada aqui no blog e nas redes. Me acompanha por lá — ou puxa papo."
          : "I publish what I learn about applied AI here on the blog and on social. Follow along — or say hi."}
      </p>
      <Link
        href={institutionalRoutes.contact[locale]}
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        {locale === "pt" ? "Me acha nas redes" : "Find me online"}
      </Link>
    </section>
  );
}
