import Link from "next/link";
import { Clock } from "lucide-react";
import {
  bookingServices,
  formatDuration,
  formatPrice,
} from "@/features/booking/services";
import type { Locale } from "@/lib/i18n/config";

const copy = {
  pt: {
    title: "Agendar uma conversa",
    intro:
      "Escolha o formato que faz sentido para o seu caso. Tudo é online, e o horário aparece já convertido para o seu fuso.",
    free: "Comece por aqui",
    book: "Escolher horário",
  },
  en: {
    title: "Book a conversation",
    intro:
      "Pick the format that fits your case. Everything is online, and the times show up already converted to your timezone.",
    free: "Start here",
    book: "Pick a time",
  },
} as const;

export function BookingCatalog({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const basePath = locale === "pt" ? "/agendar" : "/en/booking";

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight">
        {text.title}
      </h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">{text.intro}</p>

      <ul className="grid gap-4">
        {bookingServices.map((service) => {
          const content = service[locale];
          return (
            <li key={service.slug}>
              <Link
                href={`${basePath}/${service.slug}`}
                className="hover:border-primary hover:bg-accent block rounded-lg border p-6 transition"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h2 className="font-heading text-xl font-semibold">
                    {content.name}
                  </h2>
                  <span className="text-primary font-mono text-sm">
                    {formatPrice(service, locale)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {content.summary}
                </p>
                <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {formatDuration(service, locale)}
                  </span>
                  {service.featured ? (
                    <span className="text-primary font-mono uppercase">
                      {text.free}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
