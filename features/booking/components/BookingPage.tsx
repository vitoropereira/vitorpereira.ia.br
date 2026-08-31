import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { BookingEmbed } from "@/features/booking/components/BookingEmbed";
import {
  formatDuration,
  formatPrice,
  type BookingService,
} from "@/features/booking/services";
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

const copy = {
  pt: { back: "Todos os formatos", note: "Nada é cobrado no agendamento." },
  en: { back: "All formats", note: "Nothing is charged at booking." },
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
  const basePath = locale === "pt" ? "/agendar" : "/en/booking";

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
        <BookingEmbed
          namespace={service.slug}
          calLink={`${siteConfig.booking.calHandle}/${service.calSlug}`}
        />
      </div>
    </section>
  );
}
