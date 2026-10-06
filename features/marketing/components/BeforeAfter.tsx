import { CheckCircle2, XCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/motion/Reveal";

const copy = {
  pt: {
    eyebrow: "exemplo",
    title: "O mesmo processo, antes e depois",
    before: {
      label: "Hoje",
      items: [
        "Alguém copia dados de um sistema para outro.",
        "A conferência é feita à mão, item por item.",
        "O erro aparece tarde, quando já virou retrabalho.",
        "Ninguém sabe ao certo o que foi feito e quando.",
      ],
    },
    after: {
      label: "Com um agente",
      items: [
        "O repetitivo é executado sozinho, no ritmo em que chega.",
        "O agente para e pergunta quando o caso é sensível.",
        "A divergência aparece na hora, com o motivo.",
        "Cada passo fica registrado e pode ser revisto.",
      ],
    },
  },
  en: {
    eyebrow: "example",
    title: "The same process, before and after",
    before: {
      label: "Today",
      items: [
        "Someone copies data from one system into another.",
        "Checks are done by hand, item by item.",
        "Errors show up late, after they turned into rework.",
        "Nobody knows exactly what was done and when.",
      ],
    },
    after: {
      label: "With an agent",
      items: [
        "Repetitive work runs on its own, as it arrives.",
        "The agent stops and asks when a case is sensitive.",
        "Mismatches show up right away, with the reason.",
        "Every step is recorded and can be reviewed.",
      ],
    },
  },
};

export function BeforeAfter({ locale }: { locale: Locale }) {
  const t = copy[locale === "en" ? "en" : "pt"];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-primary font-mono text-sm tracking-wider uppercase">
        {t.eyebrow}
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
        {t.title}
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal className="bg-muted/40 rounded-xl border p-6">
          <h3 className="text-muted-foreground font-mono text-sm tracking-wider uppercase">
            {t.before.label}
          </h3>
          <ul className="mt-4 space-y-3">
            {t.before.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <XCircle
                  aria-hidden="true"
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal
          delay={120}
          className="border-primary/40 bg-card rounded-xl border p-6"
        >
          <h3 className="text-primary font-mono text-sm tracking-wider uppercase">
            {t.after.label}
          </h3>
          <ul className="mt-4 space-y-3">
            {t.after.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <CheckCircle2
                  aria-hidden="true"
                  className="text-primary mt-0.5 size-4 shrink-0"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
