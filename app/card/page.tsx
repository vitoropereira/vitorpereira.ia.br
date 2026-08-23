import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, UserRoundPlus } from "lucide-react";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TabNewsIcon,
  WhatsappIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/brand/SocialIcons";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { TrackedLink } from "@/features/card/components/TrackedLink";
import { cardContact, whatsappUrl } from "@/lib/card/config";
import { cardLinks, cardSiteLinks, type CardLinkId } from "@/lib/card/links";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = buildMetadata({
  title: "Vitor Pereira — contato",
  description:
    "Cartão de visita digital do Vitor Pereira. Salve o contato, chame no WhatsApp ou escolha a rede que preferir.",
  path: "/card",
  locale: "pt",
  type: "website",
});

const ICONS: Record<CardLinkId, React.ComponentType<{ className?: string }>> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  instagram: InstagramIcon,
  x: XIcon,
  youtube: YoutubeIcon,
  tabnews: TabNewsIcon,
};

const wa = whatsappUrl(cardContact);

/**
 * Cartão de visita digital — destino do QR Code.
 *
 * Fica fora do grupo (site) de propósito: sem header, footer, command palette
 * nem banner de consentimento. Quem chega aqui escaneou um QR em pé, no meio de
 * um evento, com uns dez segundos de atenção — a página tem um único trabalho,
 * que é passar o contato pro celular da pessoa antes dela ir embora.
 *
 * A classe `dark` no wrapper fixa a paleta escura da marca independente do tema
 * que o visitante usa no site.
 */
export default function CardPage() {
  return (
    <div
      className="dark bg-background text-foreground min-h-dvh"
      style={{ colorScheme: "dark" }}
    >
      {/* Fita do crachá: a única superfície de cor cheia da página. */}
      <div className="from-brand to-brand-2 h-1 w-full bg-gradient-to-r" />

      <main className="mx-auto flex w-full max-w-md flex-col gap-10 px-6 pt-12 pb-16">
        <header className="flex items-center gap-5">
          <Image
            src="/vitor.png"
            alt=""
            width={96}
            height={96}
            priority
            className="border-border bg-card h-24 w-24 shrink-0 rounded-2xl border object-cover object-top"
          />
          <div className="min-w-0">
            <h1 className="font-mono text-2xl font-semibold tracking-tight lowercase">
              <span className="text-foreground">vitor</span>
              <span className="text-muted-foreground pl-[0.3ch]">pereira</span>
              <span aria-hidden className="brand-cursor" />
            </h1>
            <p className="text-foreground mt-2 text-sm leading-snug font-medium">
              {siteConfig.tagline.pt}
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-snug">
              Sem hype, sem demo fake.
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="sr-only">Contato direto</h2>

          <TrackedLink
            href="/card/vitor.vcf"
            event="vcard"
            external={false}
            className="bg-brand text-brand-foreground focus-visible:ring-brand focus-visible:ring-offset-background flex items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-base font-semibold transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-95"
          >
            <UserRoundPlus className="h-5 w-5" aria-hidden />
            Salvar contato
          </TrackedLink>

          <div className="grid grid-cols-2 gap-3">
            {wa ? (
              <TrackedLink
                href={wa}
                event="whatsapp"
                className="border-border bg-card hover:border-brand focus-visible:ring-brand focus-visible:ring-offset-background flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <WhatsappIcon className="h-4 w-4" />
                WhatsApp
              </TrackedLink>
            ) : null}
            <TrackedLink
              href={`mailto:${cardContact.email}`}
              event="email"
              external={false}
              className={`border-border bg-card hover:border-brand focus-visible:ring-brand focus-visible:ring-offset-background flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${wa ? "" : "col-span-2"}`}
            >
              <Mail className="h-4 w-4" aria-hidden />
              E-mail
            </TrackedLink>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground mb-1 font-mono text-xs tracking-widest uppercase">
            Onde me achar
          </h2>
          {cardLinks.map((link) => {
            const Icon = ICONS[link.id];
            return (
              <TrackedLink
                key={link.id}
                href={link.href}
                event={link.id}
                className="border-border hover:border-brand hover:bg-card focus-visible:ring-brand focus-visible:ring-offset-background group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="text-muted-foreground group-hover:text-brand flex h-5 w-5 shrink-0 items-center justify-center transition-colors">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {link.label}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {link.description}
                  </span>
                </span>
                <ArrowUpRight
                  className="text-muted-foreground group-hover:text-brand h-4 w-4 shrink-0 transition-colors"
                  aria-hidden
                />
              </TrackedLink>
            );
          })}
        </section>

        <footer className="border-border flex flex-col gap-3 border-t pt-6">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {cardSiteLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="text-muted-foreground hover:text-brand font-mono text-xs transition-colors"
          >
            vitorpereira.ia.br
          </Link>
        </footer>
      </main>
    </div>
  );
}
