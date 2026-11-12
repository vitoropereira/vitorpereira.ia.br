import type { StatusFabrica } from "../status";

export function Rodape({
  status,
  minutosDesde,
}: {
  status: StatusFabrica;
  minutosDesde: number | null;
}) {
  const { gargalo } = status;
  return (
    <footer className="text-muted-foreground flex flex-col gap-1 text-xs">
      {gargalo && (
        <p>
          gargalo: {gargalo.estacao}
          {gargalo.estacao && gargalo.texto && " — "}
          {gargalo.texto}
        </p>
      )}
      <p>
        {Object.entries(status.semana)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ") || "sem resumo da semana"}
      </p>
      {minutosDesde !== null && <p>gerado há {minutosDesde} min</p>}
    </footer>
  );
}
