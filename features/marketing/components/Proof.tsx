import type { Locale } from "@/lib/i18n/config";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";

type Stat = {
  value: string | { pt: string; en: string };
  pt: { label: string; context: string };
  en: { label: string; context: string };
};

const stats: Stat[] = [
  {
    value: "70+",
    pt: {
      label: "founders simultâneos",
      context: "num agente de conversa ao vivo, com regras de proteção próprias",
    },
    en: {
      label: "simultaneous founders",
      context: "on a live conversational agent, with its own safety rules",
    },
  },
  {
    value: "~700",
    pt: {
      label: "análises por IA / dia",
      context: "resumos automáticos gerados a cada 3 minutos",
    },
    en: {
      label: "AI analyses / day",
      context: "automatic summaries generated every 3 minutes",
    },
  },
  {
    value: { pt: "3,6M+", en: "3.6M+" },
    pt: {
      label: "interações processadas",
      context: "em ~2.900 grupos de WhatsApp, com IA dentro do produto",
    },
    en: {
      label: "interactions processed",
      context: "across ~2,900 WhatsApp groups, with AI built into the product",
    },
  },
  {
    value: "~400",
    pt: {
      label: "atualizações em produção",
      context: "numa plataforma com 165 testes automatizados passando",
    },
    en: {
      label: "production releases",
      context: "on a platform with 165 passing automated tests",
    },
  },
];

export function Proof({ locale }: { locale: Locale }) {
  const lang = locale === "en" ? "en" : "pt";

  return (
    <section className="border-y">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {lang === "en" ? "in production" : "em produção"}
        </p>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            // O leitor de EN leria "3,6" como três mil e seiscentos
            const v =
              typeof stat.value === "string" ? stat.value : stat.value[lang];
            return (
              <Reveal key={v + stat[lang].label} delay={i * 80}>
                <dt className="sr-only">{stat[lang].label}</dt>
                <dd>
                  <CountUp
                    value={v}
                    className="text-primary block font-mono text-4xl font-semibold tracking-tight tabular-nums"
                  />
                  <span className="mt-2 block font-sans text-sm font-semibold">
                    {stat[lang].label}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {stat[lang].context}
                  </span>
                </dd>
              </Reveal>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
