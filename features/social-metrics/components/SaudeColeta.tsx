import type { Saude } from "../queries/painel";
import { NOME_REDE, dataHora } from "./formato";

const NOME_JOB: Record<string, string> = {
  collect: "Coleta diária",
  backfill: "Backfill",
  sync_pecas: "Sync de peças",
  refresh_token: "Renovação de token",
};

// O aviso leva borda, ícone textual e frase: não depende só da cor para ser
// notado.
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-destructive text-destructive rounded-md border-l-4 bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-3 py-2 text-sm"
    >
      <strong>Atenção:</strong> {children}
    </p>
  );
}

export function SaudeColeta({ saude }: { saude: Saude }) {
  if (saude.aviso) return <Aviso>{saude.aviso}</Aviso>;
  return (
    <ul className="flex flex-col gap-3">
      {saude.itens.map((i) => (
        <li key={`${i.rede ?? ""}:${i.job}`} className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span className="font-medium">
              {NOME_JOB[i.job] ?? i.job}
              {i.rede && ` · ${NOME_REDE[i.rede]}`}
            </span>
            <span className="text-muted-foreground text-xs">
              último run {dataHora(i.ultimoEm)} ·{" "}
              {i.ok === true
                ? "ok"
                : i.ok === false
                  ? "falhou"
                  : "em andamento"}
              {i.ultimoSucessoEm && i.ok !== true && (
                <> · último sucesso {dataHora(i.ultimoSucessoEm)}</>
              )}
            </span>
          </div>
          {i.aviso && <Aviso>{i.aviso}</Aviso>}
        </li>
      ))}
    </ul>
  );
}
