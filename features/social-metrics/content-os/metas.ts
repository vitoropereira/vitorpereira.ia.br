import matter from "gray-matter";
import type { Meta } from "../types.ts";
import { normalizarData } from "./peca.ts";

const REDES: readonly string[] = ["youtube", "instagram"];
const TIPOS: readonly string[] = [
  "longo",
  "short",
  "reel",
  "carrossel",
  "imagem",
  "estatico",
];

const SO_YAML = {
  js: () => {
    throw new Error("só YAML");
  },
  javascript: () => {
    throw new Error("só YAML");
  },
};

export interface ResultadoMetas {
  metas: Meta[];
  avisos: string[];
}

function validar(item: unknown, i: number): Meta | string {
  const rotulo = `metas.yml[${i}]`;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return `${rotulo}: entrada não é um objeto`;
  }
  const o = item as Record<string, unknown>;
  if (typeof o.rede !== "string" || !REDES.includes(o.rede)) {
    return `${rotulo}: rede inválida`;
  }
  if (typeof o.tipo !== "string" || !TIPOS.includes(o.tipo)) {
    return `${rotulo}: tipo inválido`;
  }
  if (
    typeof o.por_semana !== "number" ||
    !Number.isFinite(o.por_semana) ||
    o.por_semana <= 0
  ) {
    return `${rotulo}: por_semana deve ser número maior que 0`;
  }
  const vigente = normalizarData(o.vigente_desde);
  if (!vigente) return `${rotulo}: vigente_desde inválido`;
  return {
    rede: o.rede as Meta["rede"],
    tipo: o.tipo as Meta["tipo"],
    por_semana: o.por_semana,
    vigente_desde: vigente,
  };
}

/**
 * Lê `metas.yml`. Nunca lança: entrada inválida é rejeitada com aviso e as
 * válidas seguem; YAML quebrado ou raiz que não é lista rejeita tudo.
 * O gray-matter lê o YAML (envolvido em `---`) para não somar uma dependência.
 */
export function parsearMetas(conteudo: string): ResultadoMetas {
  let raiz: unknown;
  try {
    raiz = matter(`---\n${conteudo}\n---\n`, { engines: SO_YAML }).data;
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    return { metas: [], avisos: [`metas.yml: YAML inválido (${msg})`] };
  }
  if (!Array.isArray(raiz)) {
    return { metas: [], avisos: ["metas.yml: a raiz deve ser uma lista"] };
  }

  const metas: Meta[] = [];
  const avisos: string[] = [];
  const vistas = new Set<string>();
  raiz.forEach((item, i) => {
    const r = validar(item, i);
    if (typeof r === "string") {
      avisos.push(r);
      return;
    }
    const chave = `${r.rede}/${r.tipo}/${r.vigente_desde}`;
    if (vistas.has(chave)) {
      avisos.push(`metas.yml[${i}]: ${chave} repetida, a última vence`);
    }
    vistas.add(chave);
    metas.push(r);
  });
  return { metas, avisos };
}
