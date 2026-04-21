import { Hero } from "@/features/marketing/components/Hero";
import { Specialties } from "@/features/marketing/components/Specialties";
import { FeaturedProjects } from "@/features/marketing/components/FeaturedProjects";
import { LatestPosts } from "@/features/marketing/components/LatestPosts";
import { ContactCTA } from "@/features/marketing/components/ContactCTA";

export default function HomePageEn() {
  return (
    <>
      <Hero locale="en" />
      <Specialties locale="en" />
      <FeaturedProjects locale="en" />
      <LatestPosts locale="en" />
      <ContactCTA locale="en" />
    </>
  );
}
