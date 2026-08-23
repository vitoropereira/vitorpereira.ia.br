import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { buildMetadata } from "@/components/seo/buildMetadata";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TabNewsIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/brand/SocialIcons";

export const metadata: Metadata = buildMetadata({
  title: "Contato",
  description:
    "Sou mais ativo nas redes sociais. LinkedIn, GitHub, X, Instagram, YouTube e TabNews — escolha a que preferir.",
  path: "/contato",
  locale: "pt",
  alternatePath: "/en/contact",
  type: "website",
});

const items = [
  {
    name: "LinkedIn",
    href: siteConfig.social.linkedin,
    icon: LinkedinIcon,
    desc: "Conteúdo mais profissional, projetos e histórico.",
  },
  {
    name: "GitHub",
    href: siteConfig.social.github,
    icon: GithubIcon,
    desc: "Código, projetos open source e experimentos.",
  },
  {
    name: "X (Twitter)",
    href: siteConfig.social.x,
    icon: XIcon,
    desc: "Ideias rápidas sobre IA aplicada, agentes e produto.",
  },
  {
    name: "Instagram",
    href: siteConfig.social.instagram,
    icon: InstagramIcon,
    desc: "Bastidores, dia a dia e ideias rápidas.",
  },
  {
    name: "YouTube",
    href: siteConfig.social.youtube,
    icon: YoutubeIcon,
    desc: "Vídeos sobre IA aplicada, agentes e sistemas reais.",
  },
  {
    name: "TabNews",
    href: siteConfig.social.tabnews,
    icon: TabNewsIcon,
    desc: "Artigos e discussões na comunidade de devs.",
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight">
        Vamos conversar
      </h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Sou mais ativo nas redes abaixo. Escolha a que preferir — respondo em
        todas.
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:border-primary hover:bg-accent flex items-start gap-4 rounded-lg border p-5 transition"
            >
              <div className="text-muted-foreground mt-0.5">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-sans font-semibold">{item.name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.desc}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
