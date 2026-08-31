import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPage } from "@/features/booking/components/BookingPage";
import {
  bookingServices,
  getBookingService,
} from "@/features/booking/services";
import { buildMetadata } from "@/components/seo/buildMetadata";

export function generateStaticParams() {
  return bookingServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getBookingService(slug);
  if (!service) {
    return buildMetadata({
      title: "Agendar",
      description:
        "Escolha um formato e marque uma conversa sobre um processo da sua operação.",
      path: "/agendar",
      locale: "pt",
      alternatePath: "/en/booking",
      type: "website",
    });
  }
  return buildMetadata({
    title: service.pt.name,
    description: service.pt.summary,
    path: `/agendar/${service.slug}`,
    locale: "pt",
    alternatePath: `/en/booking/${service.slug}`,
    type: "website",
  });
}

export default async function BookingServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getBookingService(slug);
  if (!service) notFound();
  return <BookingPage service={service} locale="pt" />;
}
