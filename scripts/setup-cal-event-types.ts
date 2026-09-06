/**
 * Provisiona no Cal.com os event types que o catálogo do site já declara.
 *
 * O site é a fonte da verdade: `features/booking/services.ts` define slug,
 * duração, nome e resumo de cada serviço, e cada um vira uma rota
 * `/agendar/<slug>`. Se o event type correspondente não existir no Cal.com, a
 * página vai ao ar com calendário morto — o embed não acha o link e o fallback
 * também não.
 *
 * Este script fecha essa lacuna e a mantém fechada: rodado de novo, ele não
 * duplica nada, só relata o que já bate e o que divergiu.
 *
 * Uso:
 *   pnpm cal:setup             # dry-run — mostra o plano, não escreve nada
 *   pnpm cal:setup --apply     # cria o que falta
 *
 * Precisa de CAL_API_KEY no ambiente (cal.com → Settings → Developer → API
 * keys). É chave de CLI local: NÃO é NEXT_PUBLIC e NÃO vai para a Vercel.
 */

import { bookingServices } from "../features/booking/services.ts";
import { siteConfig } from "../lib/siteConfig.ts";

const API = "https://api.cal.com/v2";
const API_VERSION = "2024-06-14";

type CalEventType = {
  id: number;
  slug: string;
  title: string;
  lengthInMinutes?: number;
  hidden?: boolean;
};

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function call(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CAL_API_KEY}`,
      "cal-api-version": API_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

/** A resposta da v2 vem embrulhada em `{ status, data }`. */
function unwrap(body: unknown): unknown {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

async function listExisting(username: string): Promise<CalEventType[]> {
  const { status, body } = await call(
    `/event-types?username=${encodeURIComponent(username)}`,
  );
  if (status !== 200) {
    fail(
      `GET /event-types respondeu ${status}. Confira a CAL_API_KEY e o handle "${username}".\n${JSON.stringify(body, null, 2)}`,
    );
  }
  const data = unwrap(body);
  if (!Array.isArray(data)) {
    fail(
      `GET /event-types devolveu formato inesperado:\n${JSON.stringify(body, null, 2)}`,
    );
  }
  return data as CalEventType[];
}

async function create(
  service: (typeof bookingServices)[number],
): Promise<void> {
  const { status, body } = await call("/event-types", {
    method: "POST",
    body: JSON.stringify({
      title: service.pt.name,
      slug: service.calSlug,
      lengthInMinutes: service.durationMinutes,
      description: service.pt.summary,
    }),
  });
  if (status !== 201 && status !== 200) {
    fail(
      `POST /event-types falhou em "${service.calSlug}" com ${status}:\n${JSON.stringify(body, null, 2)}`,
    );
  }
  console.log(`  ✓ criado: ${service.calSlug} (${service.durationMinutes}min)`);
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const handle = siteConfig.booking.calHandle;

  if (!process.env.CAL_API_KEY) {
    fail(
      "CAL_API_KEY não está no ambiente.\n" +
        "  1. cal.com → Settings → Developer → API keys\n" +
        "  2. adicione CAL_API_KEY=cal_live_... ao .env.development.local",
    );
  }

  console.log(`\nPerfil: ${handle}`);
  console.log(
    apply ? "Modo: APPLY (escreve)\n" : "Modo: dry-run (não escreve)\n",
  );

  const existing = await listExisting(handle);
  const bySlug = new Map(existing.map((e) => [e.slug, e]));

  const missing: typeof bookingServices = [];
  const drift: string[] = [];

  for (const service of bookingServices) {
    const found = bySlug.get(service.calSlug);
    if (!found) {
      missing.push(service);
      console.log(
        `  falta  ${service.calSlug} (${service.durationMinutes}min)`,
      );
      continue;
    }
    const okDuration = found.lengthInMinutes === service.durationMinutes;
    console.log(
      `  existe ${service.calSlug} (id ${found.id}, ${found.lengthInMinutes}min)` +
        (okDuration
          ? ""
          : `  ← duração diverge, o site diz ${service.durationMinutes}min`) +
        (found.hidden ? "  ← OCULTO no Cal.com, a página não agenda" : ""),
    );
    if (!okDuration) {
      drift.push(
        `${service.calSlug}: Cal.com ${found.lengthInMinutes}min vs site ${service.durationMinutes}min`,
      );
    }
    if (found.hidden) {
      drift.push(`${service.calSlug}: está oculto no Cal.com`);
    }
  }

  console.log(
    `\n${bookingServices.length} no catálogo · ${bookingServices.length - missing.length} já no Cal.com · ${missing.length} a criar`,
  );

  if (missing.length > 0 && !apply) {
    console.log("\nRode de novo com --apply para criar os que faltam.\n");
    return;
  }

  if (missing.length > 0) {
    console.log("");
    for (const service of missing) {
      await create(service);
    }
  }

  // Reconferir no servidor: o que o script acha que criou vale menos do que o
  // que o Cal.com devolve depois.
  const after = await listExisting(handle);
  const afterSlugs = new Set(after.map((e) => e.slug));
  const stillMissing = bookingServices
    .filter((s) => !afterSlugs.has(s.calSlug))
    .map((s) => s.calSlug);

  console.log("");
  if (stillMissing.length > 0) {
    fail(`Ainda faltam no Cal.com: ${stillMissing.join(", ")}`);
  }
  console.log("✓ os 6 event types do catálogo existem no Cal.com.");
  if (drift.length > 0) {
    console.log("\n⚠ divergências que o script NÃO corrige sozinho:");
    for (const d of drift) console.log(`  - ${d}`);
    console.log("  Ajuste no painel do Cal.com ou alinhe o catálogo do site.");
  }
  console.log("");
}

await main();
