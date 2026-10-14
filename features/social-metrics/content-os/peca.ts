import matter from "gray-matter";
import type { Peca, Plataforma } from "../types.ts";

const PLATAFORMAS: readonly string[] = ["youtube", "instagram", "linkedin"];
const CAMPOS_TEXTO = ["formato", "pauta", "hook", "template", "testa"] as const;

// `---js` no frontmatter executaria código do arquivo: o gray-matter só pode
// falar YAML aqui, e qualquer outra linguagem cai no aviso.
const SO_YAML = {
  js: () => {
    throw new Error("frontmatter só pode ser YAML");
  },
  javascript: () => {
    throw new Error("frontmatter só pode ser YAML");
  },
};

/** Nome do arquivo sem a pasta e sem `.md`. */
export function slugDoCaminho(caminho: string): string {
  const arquivo = caminho.slice(caminho.lastIndexOf("/") + 1);
  return arquivo.replace(/\.md$/, "");
}

/**
 * O YAML do gray-matter transforma `2026-10-11` em `Date` (UTC meia-noite);
 * a peça guarda a data pura, então normaliza para `AAAA-MM-DD` em UTC.
 */
export function normalizarData(v: unknown): string | null | undefined {
  if (v === undefined || v === null || v === "") return null;
  let dia: string;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return undefined;
    dia = v.toISOString().slice(0, 10);
  } else if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ].*)?$/);
    if (!m) return undefined;
    dia = m[1];
  } else {
    return undefined;
  }
  const d = new Date(`${dia}T00:00:00Z`);
  // `2026-02-31` rola para março: só vale se a data volta igual.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dia
    ? dia
    : undefined;
}

export type ResultadoPeca = { peca: Peca } | { aviso: string };

/**
 * Lê uma peça do content-os. Nunca lança: YAML quebrado ou campo de interesse
 * fora do contrato devolve `{ aviso }` e o job segue com as outras peças.
 * Chaves que o sync não usa são ignoradas; textos ficam como string pura.
 */
export function parsearPeca(caminho: string, conteudo: string): ResultadoPeca {
  const slug = slugDoCaminho(caminho);
  let data: Record<string, unknown>;
  try {
    data = matter(conteudo, { engines: SO_YAML }).data;
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    return { aviso: `${slug}: YAML inválido (${msg})` };
  }

  const invalido = (campo: string) => ({
    aviso: `${slug}: campo ${campo} fora do contrato`,
  });

  const textos: Record<string, string | null> = {};
  for (const campo of CAMPOS_TEXTO) {
    const v = data[campo];
    if (v === undefined || v === null) textos[campo] = null;
    else if (typeof v === "string") textos[campo] = v.trim() || null;
    else return invalido(campo);
  }

  const ids: Record<string, string | null> = {};
  for (const campo of ["youtube_id", "instagram_id"] as const) {
    const v = data[campo];
    if (v === undefined || v === null) ids[campo] = null;
    else if (typeof v === "string") ids[campo] = v.trim() || null;
    // Id numérico sem aspas perde precisão acima de 2^53: pede aspas.
    else
      return {
        aviso: `${slug}: campo ${campo} fora do contrato (precisa ser texto, entre aspas)`,
      };
  }

  const p = data.plataforma;
  if (p !== undefined && p !== null && !PLATAFORMAS.includes(p as string)) {
    return invalido("plataforma");
  }

  const created = normalizarData(data.created);
  if (created === undefined) return invalido("created");
  const publicado = normalizarData(data.publicado);
  if (publicado === undefined) return invalido("publicado");

  return {
    peca: {
      slug,
      plataforma: (p as Plataforma | undefined) ?? null,
      formato: textos.formato,
      pauta: textos.pauta,
      hook: textos.hook,
      template: textos.template,
      testa: textos.testa,
      created,
      publicado,
      youtube_id: ids.youtube_id,
      instagram_id: ids.instagram_id,
    },
  };
}
