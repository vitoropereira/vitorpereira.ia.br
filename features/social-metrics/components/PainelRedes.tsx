import { REDES, type Painel } from "../queries/painel";
import { Cadencia } from "./Cadencia";
import { GraficoSemanal } from "./GraficoSemanal";
import { GraficoSeguidores } from "./GraficoSeguidores";
import { SaudeColeta } from "./SaudeColeta";
import { NOME_REDE, pontosSeguidores } from "./formato";

// Os quatro blocos do /admin/redes. Recebe o painel já calculado: a página
// cuida de autenticação e leitura, este componente só desenha.

function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descricao && (
          <p className="text-muted-foreground text-sm">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function SemDado() {
  return <p className="text-muted-foreground text-sm">Sem dado no período.</p>;
}

export function PainelRedes({ painel }: { painel: Painel }) {
  return (
    <>
      <Bloco titulo="Saúde da coleta">
        <SaudeColeta saude={painel.saude} />
      </Bloco>

      <Bloco
        titulo="Seguidores"
        descricao="Últimos 90 dias. Linha sólida é o total da API; tracejada, reconstruída. Dia sem dado aparece como lacuna."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {REDES.map((rede) => {
            const dados = pontosSeguidores(painel.seguidores, rede);
            return (
              <div key={rede} className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">{NOME_REDE[rede]}</h3>
                {dados.some(
                  (d) => d.valor !== null || d.reconstruido !== null,
                ) ? (
                  <GraficoSeguidores rede={rede} dados={dados} />
                ) : (
                  <SemDado />
                )}
              </div>
            );
          })}
        </div>
      </Bloco>

      <Bloco
        titulo="Views e alcance por semana"
        descricao="Semanas de segunda a domingo, horário de Brasília."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {REDES.map((rede) => {
            const dados = painel.semanal.map((p) => ({
              semana: p.semana,
              views: p[`views_${rede}`],
              alcance: p[`alcance_${rede}`],
            }));
            return (
              <div key={rede} className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">{NOME_REDE[rede]}</h3>
                {dados.some((d) => d.views !== null || d.alcance !== null) ? (
                  <GraficoSemanal rede={rede} dados={dados} />
                ) : (
                  <SemDado />
                )}
              </div>
            );
          })}
        </div>
      </Bloco>

      <Bloco
        titulo="Cadência"
        descricao="Posts publicados contra a meta vigente em cada semana."
      >
        <Cadencia linhas={painel.cadencia} semanas={painel.semanas} />
      </Bloco>
    </>
  );
}
