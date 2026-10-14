export function EstadoVazio() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm">
      <p className="font-medium">A coleta ainda não rodou.</p>
      <p className="text-muted-foreground mt-2">
        As tabelas vitor_social_* estão vazias. Rode{" "}
        <code>pnpm social:collect</code> (ou espere o workflow diário) e
        cadastre as metas em <code>vitor_social_goals</code> para ver
        seguidores, cadência e saúde da coleta aqui.
      </p>
    </div>
  );
}
