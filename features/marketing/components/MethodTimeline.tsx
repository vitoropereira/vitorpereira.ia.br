import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/motion/Reveal";

const copy = {
  pt: [
    {
      title: "Mapear",
      text: "o processo, a entrada, a saída e os limites",
    },
    {
      title: "Avaliar",
      text: "critérios de resultado, trajeto, segurança e custo antes de construir",
    },
    {
      title: "Implantar",
      text: "uma fatia pequena em produção, com dados reais",
    },
    { title: "Operar", text: "acompanhar e só então ampliar a autonomia" },
  ],
  en: [
    { title: "Map", text: "the workflow, its input, output, and boundaries" },
    {
      title: "Evaluate",
      text: "criteria for outcome, path, security, and cost before building",
    },
    { title: "Deploy", text: "one thin slice in production, with real data" },
    { title: "Operate", text: "monitor it, and only then expand autonomy" },
  ],
} as const;

export function MethodTimeline({ locale }: { locale: Locale }) {
  const steps = copy[locale === "en" ? "en" : "pt"];

  return (
    // Wrapper relativo: a linha fica fora do <ol> pra não pôr um <div> dentro da lista.
    <div className="relative">
      {/* top-[20px] = centro do marcador (size-10 = 40px, sem margem acima).
          Inset 12.5%/75% = centro da 1ª à 4ª de 4 colunas iguais. Se mudar o
          markup da etapa, recalcule. Sem vectorEffect: ele quebra o pathLength. */}
      <Reveal variant="fade">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-[20px] left-[12.5%] hidden h-px w-[75%] md:block"
          preserveAspectRatio="none"
          viewBox="0 0 100 1"
        >
          <line
            x1="0"
            y1="0.5"
            x2="100"
            y2="0.5"
            stroke="var(--brand)"
            strokeOpacity="0.5"
            strokeWidth={1}
            strokeDasharray={100}
            strokeDashoffset={100}
            pathLength={100}
            className="how-line"
          />
        </svg>
      </Reveal>
      <ol className="grid gap-8 md:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal
            as="li"
            key={step.title}
            className="flex gap-4 md:flex-col md:items-center md:text-center"
            delay={i * 100}
          >
            <span className="bg-accent text-primary relative inline-flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold md:mt-1">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
