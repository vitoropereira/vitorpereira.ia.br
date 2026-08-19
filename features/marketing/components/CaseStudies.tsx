import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const cases = {
  pt: [
    {
      title: "A fila que preservou o payload quando a operação falhou",
      description:
        "Por que guardar o evento cru tornou recuperação e reprocessamento parte da arquitetura, não um improviso.",
      href: "/2026/08/06/fila-que-guarda-o-payload-cru",
      tag: "recuperação operacional",
    },
    {
      title: "IDOR e RLS: a fronteira precisa ficar no servidor",
      description:
        "Um pentest encontrou acesso cruzado entre clientes. O que mudou nas permissões e nos testes de resistência.",
      href: "/2026/08/08/idor-a-fronteira-e-o-servidor",
      tag: "segurança",
    },
    {
      title: "Ferramentas como contrato, não como sugestão",
      description:
        "Como desenhar tools para reduzir ambiguidade, impedir ações inválidas e deixar o agente mais previsível.",
      href: "/2026/07/25/ferramentas-como-contrato",
      tag: "arquitetura de agentes",
    },
    {
      title: "Memória de agente não é guardar tudo",
      description:
        "O que entra, o que sai e por que memória sem política vira custo, ruído e risco.",
      href: "/2026/08/11/memoria-de-agente",
      tag: "memória",
    },
    {
      title: "Quatro eixos para avaliar um agente",
      description:
        "Resultado, trajeto, segurança e custo. Acertar a resposta é só um quarto do trabalho.",
      href: "/2026/08/13/avaliar-agente-quatro-eixos",
      tag: "avaliação",
    },
  ],
  en: [
    {
      title: "The queue that preserved the raw payload",
      description:
        "Why storing the original event made recovery and replay part of the architecture instead of an emergency patch.",
      href: "/en/2026/08/06/fila-que-guarda-o-payload-cru",
      tag: "operational recovery",
    },
    {
      title: "IDOR and RLS: the boundary belongs on the server",
      description:
        "A penetration test found cross-customer access. What changed in permissions and adversarial tests.",
      href: "/en/2026/08/08/idor-a-fronteira-e-o-servidor",
      tag: "security",
    },
    {
      title: "Tools as contracts, not suggestions",
      description:
        "How tool design reduces ambiguity, blocks invalid actions, and makes agent behavior easier to verify.",
      href: "/en/2026/07/25/ferramentas-como-contrato",
      tag: "agent architecture",
    },
  ],
} as const;

export function CaseStudies({ locale }: { locale: Locale }) {
  return (
    <section id="casos" className="scroll-mt-20 border-y">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-primary font-mono text-xs tracking-widest uppercase">
            {locale === "pt"
              ? "evidência antes de promessa"
              : "evidence before claims"}
          </p>
          <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight">
            {locale === "pt"
              ? "Casos e decisões de produção"
              : "Production cases and decisions"}
          </h2>
          <p className="text-muted-foreground mt-3">
            {locale === "pt"
              ? "Não são demos perfeitas. São relatos sobre falhas, fronteiras e escolhas que só aparecem quando o sistema começa a operar de verdade."
              : "These are not polished demos. They cover failures, boundaries, and decisions that appear only after a system starts operating for real."}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {cases[locale].map((item) => (
            <article key={item.href} className="rounded-lg border p-5">
              <p className="text-primary font-mono text-xs uppercase">
                {item.tag}
              </p>
              <h3 className="mt-3 font-sans text-lg font-semibold">
                <Link
                  href={item.href}
                  className="hover:text-primary group inline-flex gap-2"
                >
                  {item.title}
                  <ArrowUpRight className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
