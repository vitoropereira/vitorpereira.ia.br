import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { BookingEmbed } from "@/features/booking/components/BookingEmbed";
import {
  formatDuration,
  formatPrice,
  type BookingService,
} from "@/features/booking/services";
import { siteConfig } from "@/lib/siteConfig";
import { bookingIndex } from "@/features/booking/routes";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import type { Locale } from "@/lib/i18n/config";

const copy = {
  pt: {
    back: "Todos os formatos",
    note: "Nada é cobrado no agendamento.",
    fallback: "O calendário não carregou?",
    fallbackLink: "Abrir em nova aba",
    fallbackAlt: "ou fale por outro canal",
  },
  en: {
    back: "All formats",
    note: "Nothing is charged at booking.",
    fallback: "Calendar did not load?",
    fallbackLink: "Open in a new tab",
    fallbackAlt: "or reach out another way",
  },
} as const;

export function BookingPage({
  service,
  locale,
}: {
  service: BookingService;
  locale: Locale;
}) {
  const text = copy[locale];
  const content = service[locale];
  const basePath = bookingIndex(locale);
  const calLink = `${siteConfig.booking.calHandle}/${service.calSlug}`;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href={basePath}
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition"
      >
        <ArrowLeft className="size-4" />
        {text.back}
      </Link>

      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
        {content.name}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-3xl">{content.summary}</p>
      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" />
          {formatDuration(service, locale)}
        </span>
        <span className="text-primary font-mono">
          {formatPrice(service, locale)}
        </span>
        <span>{text.note}</span>
      </div>

      <div className="mt-10 min-h-[640px] overflow-hidden rounded-lg border">
        <BookingEmbed namespace={service.slug} calLink={calLink} />
      </div>

      {/* Saída para quando o iframe do Cal não renderiza — bloqueador de
          rastreadores, rede ruim ou event type ainda inexistente. Sem isto o
          CTA principal do site termina num retângulo sem link nenhum. */}
      <p className="text-muted-foreground mt-4 text-sm">
        {text.fallback}{" "}
        <a
          href={`https://cal.com/${calLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4"
        >
          {text.fallbackLink}
        </a>{" "}
        <Link
          href={institutionalRoutes.contact[locale]}
          className="hover:text-foreground underline underline-offset-4"
        >
          {text.fallbackAlt}
        </Link>
        .
      </p>
    </section>
  );
}
