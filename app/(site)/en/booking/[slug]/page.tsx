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
      title: "Book",
      description:
        "Pick a format and book a conversation about a workflow in your operation.",
      path: "/en/booking",
      locale: "en",
      alternatePath: "/agendar",
      type: "website",
    });
  }
  return buildMetadata({
    title: service.en.name,
    description: service.en.summary,
    path: `/en/booking/${service.slug}`,
    locale: "en",
    alternatePath: `/agendar/${service.slug}`,
    type: "website",
  });
}

export default async function BookingServicePageEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getBookingService(slug);
  if (!service) notFound();
  return <BookingPage service={service} locale="en" />;
}
