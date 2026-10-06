"use client";

import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Estado = "idle" | "ok" | "erro";
type Idioma = "pt" | "en";

const ROTULOS: Record<Idioma, Record<Estado, string>> = {
  pt: { idle: "Copiar código", ok: "Copiado", erro: "Não copiou" },
  en: { idle: "Copy code", ok: "Copied", erro: "Copy failed" },
};

const lerIdioma = (): Idioma =>
  document.documentElement.lang.toLowerCase().startsWith("pt") ? "pt" : "en";

const semAssinatura = () => () => {};

/**
 * Substitui o `pre` do MDX. O rehype-pretty-code gera o <pre> com atributos
 * data-* e estilos; por isso as props vão intactas para ele e o botão vive num
 * wrapper. A margem vertical fica no wrapper (ver `.code-block` no globals.css).
 */
export function CodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [estado, setEstado] = useState<Estado>("idle");
  // O servidor não tem `document`: o snapshot de servidor é PT e o cliente
  // reconcilia após a hidratação (sem mismatch). Relê o `lang` a cada render,
  // então o clique também enxerga uma troca de idioma.
  const idioma = useSyncExternalStore<Idioma>(
    semAssinatura,
    lerIdioma,
    () => "pt",
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copiar() {
    let resultado: Estado = "erro";
    try {
      await navigator.clipboard.writeText(
        (preRef.current?.textContent ?? "").replace(/\n$/, ""),
      );
      resultado = "ok";
    } catch {
      // Sem clipboard (http, permissão negada): só sinaliza a falha.
    }
    setEstado(resultado);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setEstado("idle"), 2000);
  }

  const rotulo = ROTULOS[idioma][estado];
  const Icone = estado === "ok" ? Check : estado === "erro" ? X : Copy;

  return (
    <div className="code-block group relative">
      <pre {...props} ref={preRef}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copiar}
        aria-label={rotulo}
        title={rotulo}
        className="focus-visible:ring-ring absolute top-2 right-2 flex size-8 items-center justify-center rounded-md border border-white/10 bg-[#0d1117] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none [@media(hover:none)]:opacity-100"
      >
        <Icone className="size-4" aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {estado === "idle" ? "" : rotulo}
      </span>
    </div>
  );
}
