import { CORES } from "../cores";

// Caixa do mock: fundo de painel, borda fina, cantos retos e rótulo em caixa
// alta pequena.
export function Painel({
  titulo,
  extra,
  className = "",
  children,
}: {
  titulo: string;
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-3 border p-3 ${className}`}
      style={{ background: CORES.painel, borderColor: CORES.borda }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className="text-[11px] font-medium tracking-wider uppercase"
          style={{ color: CORES.rotulo }}
        >
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
