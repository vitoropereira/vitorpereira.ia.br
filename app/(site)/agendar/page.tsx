import type { Metadata } from "next";
import { BookingCatalog } from "@/features/booking/components/BookingCatalog";
import { buildMetadata } from "@/components/seo/buildMetadata";

export const metadata: Metadata = buildMetadata({
  title: "Agendar",
  description:
    "Escolha um formato e marque uma conversa: diagnóstico de automação, escopo de projeto, consultoria técnica, revisão de arquitetura ou mentoria.",
  path: "/agendar",
  locale: "pt",
  alternatePath: "/en/booking",
  type: "website",
});

export default function BookingIndexPage() {
  return <BookingCatalog locale="pt" />;
}
