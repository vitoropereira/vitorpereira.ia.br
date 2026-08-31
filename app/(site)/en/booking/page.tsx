import type { Metadata } from "next";
import { BookingCatalog } from "@/features/booking/components/BookingCatalog";
import { buildMetadata } from "@/components/seo/buildMetadata";

export const metadata: Metadata = buildMetadata({
  title: "Book",
  description:
    "Pick a format and book a conversation: automation diagnostic, project scoping, technical consulting, architecture review, or mentoring.",
  path: "/en/booking",
  locale: "en",
  alternatePath: "/agendar",
  type: "website",
});

export default function BookingIndexPageEn() {
  return <BookingCatalog locale="en" />;
}
