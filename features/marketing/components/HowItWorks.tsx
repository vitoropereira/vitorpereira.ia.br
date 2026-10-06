import { Cog, Hand, Inbox, ScanSearch, ScrollText } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/motion/Reveal";

const copy = {
  pt: {
    eyebrow: "como funciona",
    title: "Como um agente trabalha no seu processo",
    steps: [
      {
        icon: Inbox,
        title: "Algo chega",
        text: "Uma mensagem, um e-mail, um arquivo ou um pedido.",
      },
      {
        icon: ScanSearch,
        title: "O agente entende",
        text: "Lê, extrai o que importa e confere com as regras do processo.",
      },
      {
        icon: Cog,
        title: "Age nas suas ferramentas",
        text: "Nas que a empresa já usa. Não precisa trocar de sistema.",
      },
      {
        icon: Hand,
        title: "Você aprova o que é sensível",
        text: "Ação que não dá para desfazer espera uma pessoa decidir.",
      },
      {
        icon: ScrollText,
        title: "Tudo fica registrado",
        text: "Dá para ver o que foi feito, quando e por quê.",
      },
    ],
  },
  en: {
    eyebrow: "how it works",
    title: "How an agent works inside your process",
    steps: [
      {
        icon: Inbox,
        title: "Something arrives",
        text: "A message, an email, a file, or an order.",
      },
      {
        icon: ScanSearch,
        title: "The agent understands it",
        text: "It reads, extracts what matters, and checks it against the process rules.",
      },
      {
        icon: Cog,
        title: "It acts in your tools",
        text: "The ones your company already uses. No need to switch systems.",
      },
      {
        icon: Hand,
        title: "You approve what is sensitive",
        text: "Anything that can't be undone waits for a person to decide.",
      },
      {
        icon: ScrollText,
        title: "Everything is recorded",
        text: "You can see what was done, when, and why.",
      },
    ],
  },
};

// O passo da aprovação humana é a mensagem central da seção: ganha anel no ícone.
const APPROVAL_STEP = 3;

export function HowItWorks({ locale }: { locale: Locale }) {
  const t = copy[locale === "en" ? "en" : "pt"];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-primary font-mono text-sm tracking-wider uppercase">
        {t.eyebrow}
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
        {t.title}
      </h2>

      {/* top-[44px] = centro do ícone: linha do número (text-xs, 16px) + mt-2 (8px)
          + metade do ícone (p-2.5 + size-5 = 40px, metade 20px). Se mudar o markup
          do passo, recalcule. Sem vectorEffect: ele faz o Chrome ignorar pathLength. */}
      {/* Wrapper relativo: a linha fica fora do <ol> pra não pôr um <div> dentro da lista. */}
      <div className="relative mt-12">
        <Reveal variant="fade">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-[44px] right-[10%] left-[10%] hidden h-px lg:block"
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
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {t.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal
                as="li"
                key={step.title}
                className="lg:flex lg:flex-col lg:items-center lg:text-center"
                delay={i * 80}
              >
                <span className="text-primary font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className={`bg-accent relative mt-2 inline-flex rounded-lg p-2.5 ${
                    i === APPROVAL_STEP ? "ring-primary/40 ring-1" : ""
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {step.text}
                </p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
