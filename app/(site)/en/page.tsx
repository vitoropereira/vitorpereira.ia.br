import { siteConfig } from "@/lib/siteConfig";

export default function HomePageEn() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-6 text-xl text-muted-foreground">
        {siteConfig.tagline.en}
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        Site under construction — technical blog + portfolio.
      </p>
    </section>
  );
}
