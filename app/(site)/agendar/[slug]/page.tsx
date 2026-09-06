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
    // Slug inexistente responde 404. Sem `noindex` aqui a página anunciaria o
    // canonical de /agendar, e o Google trataria a URL inválida como duplicata
    // da listagem — soft-404 clássico.
    return { title: "Agendar", robots: { index: false, follow: false } };
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
