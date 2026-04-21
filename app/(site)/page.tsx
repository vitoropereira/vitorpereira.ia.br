import { siteConfig } from "@/lib/siteConfig";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="text-muted-foreground mt-6 text-xl">
        {siteConfig.tagline.pt}
      </p>
      <p className="text-muted-foreground mt-8 text-sm">
        Site em construção — blog técnico + portfólio.
      </p>
    </section>
  );
}
