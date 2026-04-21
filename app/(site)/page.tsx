import type { Metadata } from "next";
import { Hero } from "@/features/marketing/components/Hero";
import { Specialties } from "@/features/marketing/components/Specialties";
import { FeaturedProjects } from "@/features/marketing/components/FeaturedProjects";
import { LatestPosts } from "@/features/marketing/components/LatestPosts";
import { ContactCTA } from "@/features/marketing/components/ContactCTA";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = buildMetadata({
  title: "",
  description: siteConfig.tagline.pt,
  path: "/",
  locale: "pt",
  alternatePath: "/en",
  type: "website",
});

export default function HomePage() {
  return (
    <>
      <Hero locale="pt" />
      <Specialties locale="pt" />
      <FeaturedProjects locale="pt" />
      <LatestPosts locale="pt" />
      <ContactCTA locale="pt" />
    </>
  );
}
