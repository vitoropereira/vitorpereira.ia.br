import type { Metadata } from "next";
import { Hero } from "@/features/marketing/components/Hero";
import { Proof } from "@/features/marketing/components/Proof";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { BeforeAfter } from "@/features/marketing/components/BeforeAfter";
import { Specialties } from "@/features/marketing/components/Specialties";
import { FeaturedProjects } from "@/features/marketing/components/FeaturedProjects";
import { CaseStudies } from "@/features/marketing/components/CaseStudies";
import { LatestPosts } from "@/features/marketing/components/LatestPosts";
import { Faq } from "@/features/marketing/components/Faq";
import { ContactCTA } from "@/features/marketing/components/ContactCTA";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = buildMetadata({
  title: "",
  description: siteConfig.statement.pt,
  path: "/",
  locale: "pt",
  alternatePath: "/en",
  type: "website",
});

export default function HomePage() {
  return (
    <>
      <Hero locale="pt" />
      <Proof locale="pt" />
      <HowItWorks locale="pt" />
      <BeforeAfter locale="pt" />
      <Specialties locale="pt" />
      <FeaturedProjects locale="pt" />
      <CaseStudies locale="pt" />
      <LatestPosts locale="pt" />
      <Faq locale="pt" />
      <ContactCTA locale="pt" />
    </>
  );
}
