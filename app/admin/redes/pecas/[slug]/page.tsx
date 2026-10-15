import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { CurvaIdade } from "@/features/social-metrics/components/CurvaIdade";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { TabelaPecas } from "@/features/social-metrics/components/TabelaPecas";
import { rotuloPost } from "@/features/social-metrics/components/formato";
import {
  carregarPeca,
  type PecaDetalhe,
} from "@/features/social-metrics/queries/pecas";
import { getReaderDb } from "@/features/social-metrics/queries/readerDb";

export const dynamic = "force-dynamic";

const CAMPOS = [
  ["pauta", "Pauta"],
  ["formato", "Formato"],
  ["template", "Template"],
  ["hook", "Hook"],
  ["testa", "Testa"],
] as const;

export default async function PecaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin("redes");

  const { slug } = await params;
  let peca: PecaDetalhe | null = null;
  let erro: string | null = null;
  try {
    peca = await carregarPeca(getReaderDb(), slug, new Date());
  } catch (e) {
    console.error("[admin/redes/pecas/slug] falha ao ler a peça", e);
    erro =
      "Não foi possível ler as métricas agora. Confira a conexão do papel social_reader.";
  }
  // Fora do try: o notFound do Next lança, e não pode virar aviso de banco.
  if (!erro && !peca) notFound();

  return (
    <div data-largura="ampla" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/redes/pecas"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Peças
        </Link>
        <h1 className="text-2xl font-semibold break-all">{slug}</h1>
      </header>

      {erro && <Aviso>{erro}</Aviso>}
      {peca && (
        <>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            {CAMPOS.map(([k, rotulo]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{rotulo}</dt>
                <dd>{peca[k] ?? "—"}</dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold">Views por idade</h2>
              <p className="text-muted-foreground text-sm">
                Acumulado por dia desde a publicação. Tracejado: posts de outras
                peças da mesma pauta.
              </p>
            </div>
            <CurvaIdade
              series={peca.curvas.map((c) => ({
                id: c.id,
                rede: c.rede,
                rotulo: `${rotuloPost(c.rede, c.titulo)}${c.derivado ? " (mesma pauta)" : ""}`,
                derivado: c.derivado,
                pontos: c.pontos,
              }))}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Posts desta peça</h2>
            <TabelaPecas linhas={peca.posts} />
          </section>

          {peca.derivados.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Mesma pauta</h2>
              <TabelaPecas linhas={peca.derivados} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
