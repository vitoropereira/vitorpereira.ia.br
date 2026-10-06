import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  formatDuration,
  formatPrice,
  getBookingService,
  type BookingService,
} from "@/features/booking/services";

export type FaqItem = { q: string; a: string };

// O preço entra no meio da frase, então a inicial maiúscula do formatPrice
// ("A partir de" / "From") precisa descer.
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// Preço, prazo e gratuidade da primeira conversa saem do catálogo de
// agendamento: a home não pode mostrar um número e a página de serviço outro.
// O catálogo é estático, então a ausência de uma entrada falha alto no build
// em vez de gerar uma frase quebrada.
export function buildCostAnswer(
  pilot: BookingService | undefined,
  diag: BookingService | undefined,
  locale: Locale,
): string {
  if (!pilot || !diag) {
    throw new Error(
      "Faq: catálogo de agendamento sem 'escopo-software-30-dias' ou 'diagnostico-30min'",
    );
  }
  const price = lowerFirst(formatPrice(pilot, locale));
  const free = formatPrice(diag, locale).toLowerCase();
  const dur = formatDuration(diag, locale);
  if (locale === "en") {
    return `A pilot for one workflow takes 21 to 30 days, ${price}. The exact number comes out of the scoping session, which is included. The ${diag.en.name} (${dur}) is ${free}.`;
  }
  return `O piloto de um processo leva de 21 a 30 dias, ${price}. O número exato sai do diagnóstico de escopo, que já está incluído. O ${diag.pt.name} (${dur}) é ${free}.`;
}

export function getFaq(locale: Locale): FaqItem[] {
  const costAnswer = buildCostAnswer(
    getBookingService("escopo-software-30-dias"),
    getBookingService("diagnostico-30min"),
    locale,
  );
  if (locale === "en") {
    return [
      {
        q: "Does this replace my team?",
        a: "No. The agent takes over the repetitive part of one bounded workflow; a person stays accountable for the outcome and approves high-impact actions. If the goal is to replace a whole team on day one, this is not the right place to start.",
      },
      {
        q: "What if the AI gets it wrong?",
        a: "The agent only gets the permissions it needs, fails visibly, and asks for a human decision when an action is irreversible or outside its contract. Its actions are logged, so you can see what happened and fix it.",
      },
      {
        q: "Do I need to change the systems I use?",
        a: "No. The agent works inside the tools your company already uses, as long as they can be accessed through an API.",
      },
      {
        q: "How long does it take and how much does it cost?",
        a: costAnswer,
      },
      {
        q: "Is my data safe?",
        a: "The boundary lives on the server, not in the prompt: the agent only reaches the data allowed for that workflow, and high-impact actions go through human approval and are logged.",
      },
    ];
  }
  return [
    {
      q: "Isso substitui minha equipe?",
      a: "Não. O agente assume a parte repetitiva de um processo delimitado; uma pessoa continua responsável pelo resultado e aprova as ações de maior impacto. Se a expectativa é substituir uma equipe inteira no primeiro dia, não é por aqui que se começa.",
    },
    {
      q: "E se a IA errar?",
      a: "O agente recebe só as permissões necessárias, falha de forma visível e pede decisão humana quando a ação é irreversível ou foge do combinado. As ações ficam registradas, então dá para ver o que aconteceu e corrigir.",
    },
    {
      q: "Preciso trocar os sistemas que uso?",
      a: "Não. O agente trabalha dentro das ferramentas que a empresa já usa, desde que elas possam ser acessadas por API.",
    },
    {
      q: "Quanto tempo leva e quanto custa?",
      a: costAnswer,
    },
    {
      q: "Meus dados ficam seguros?",
      a: "A fronteira fica no servidor, não no prompt: o agente só acessa os dados permitidos para aquele processo, e as ações de maior impacto passam por aprovação humana e ficam registradas.",
    },
  ];
}

export function Faq({
  locale,
  withJsonLd = true,
}: {
  locale: Locale;
  withJsonLd?: boolean;
}) {
  const items = getFaq(locale);
  const title =
    locale === "en" ? "Frequently asked questions" : "Perguntas frequentes";

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight">{title}</h2>
      <div>
        {items.map((item, i) => (
          <Reveal key={item.q} delay={i * 80}>
            <details className="group border-b py-5">
              <summary className="focus-visible:outline-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="text-muted-foreground mt-3">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
      {withJsonLd && (
        <JsonLd data={{ type: "FAQPage", items }} id="jsonld-faq" />
      )}
    </section>
  );
}
