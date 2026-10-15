import Link from "next/link";
import { REDES } from "../queries/painel";
import { TIPOS, type Filtros, type OpcoesFiltro } from "../queries/pecas";
import { NOME_REDE, NOME_TIPO } from "./formato";

// Formulário GET puro: aplicar filtro é navegar, nada é enviado para gravar.

const CAMPO =
  "border-input bg-background h-9 rounded-md border px-2 text-sm text-foreground";

function Selecao({
  nome,
  rotulo,
  valor,
  opcoes,
}: {
  nome: string;
  rotulo: string;
  valor: string | null;
  opcoes: { valor: string; texto: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{rotulo}</span>
      <select name={nome} defaultValue={valor ?? ""} className={CAMPO}>
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

const simples = (vs: string[]) => vs.map((v) => ({ valor: v, texto: v }));

export function FiltrosPecas({
  filtros,
  opcoes,
}: {
  filtros: Filtros;
  opcoes: OpcoesFiltro;
}) {
  return (
    <form
      method="get"
      action="/admin/redes/pecas"
      className="flex flex-wrap items-end gap-3"
    >
      <Selecao
        nome="rede"
        rotulo="Rede"
        valor={filtros.rede}
        opcoes={REDES.map((r) => ({ valor: r, texto: NOME_REDE[r] }))}
      />
      <Selecao
        nome="tipo"
        rotulo="Tipo"
        valor={filtros.tipo}
        opcoes={TIPOS.map((t) => ({ valor: t, texto: NOME_TIPO[t] ?? t }))}
      />
      <Selecao
        nome="formato"
        rotulo="Formato"
        valor={filtros.formato}
        opcoes={simples(opcoes.formatos)}
      />
      <Selecao
        nome="pauta"
        rotulo="Pauta"
        valor={filtros.pauta}
        opcoes={simples(opcoes.pautas)}
      />
      <Selecao
        nome="template"
        rotulo="Template"
        valor={filtros.template}
        opcoes={simples(opcoes.templates)}
      />
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Publicado de</span>
        <input
          type="date"
          name="de"
          defaultValue={filtros.de ?? ""}
          className={CAMPO}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">até</span>
        <input
          type="date"
          name="ate"
          defaultValue={filtros.ate ?? ""}
          className={CAMPO}
        />
      </label>
      {/* A ordenação atual sobrevive ao aplicar filtro. */}
      <input type="hidden" name="ordem" value={filtros.ordem} />
      <input type="hidden" name="dir" value={filtros.dir} />
      <button
        type="submit"
        className="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium"
      >
        Filtrar
      </button>
      <Link
        href="/admin/redes/pecas"
        className="text-muted-foreground h-9 content-center text-sm underline underline-offset-4"
      >
        Limpar
      </Link>
    </form>
  );
}
