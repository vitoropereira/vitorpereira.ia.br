import type { Fetch } from "../types.ts";
import { erroDaResposta } from "./http.ts";
import { numOuNull } from "./normalizar.ts";

export const REPORTING_API = "https://youtubereporting.googleapis.com/v1";

// O Analytics v2 não tem métrica de impressão da thumb; ela só sai no
// relatório em massa `channel_reach_basic_a1` (date, channel_id, video_id).
export const TIPO_ALCANCE = "channel_reach_basic_a1";
export const NOME_JOB = "vitorpereira-social-alcance";

export interface RelatorioReporting {
  id: string;
  startTime: string;
  endTime?: string;
  createTime?: string;
  downloadUrl: string;
}

export interface Alcance {
  impressions: number | null;
  ctr: number | null;
}

export interface OpcoesReporting {
  fetch: Fetch;
  accessToken: string;
}

export function criarClienteReporting({ fetch, accessToken }: OpcoesReporting) {
  const headers = { authorization: `Bearer ${accessToken}` };

  async function pedir(
    url: string,
    init: { method?: string; body?: string } = {},
  ) {
    const res = await fetch(url, {
      ...init,
      headers: init.body
        ? { ...headers, "content-type": "application/json" }
        : headers,
    });
    if (!res.ok) throw await erroDaResposta(res, "YouTube Reporting");
    return res;
  }

  /** Percorre todas as páginas de uma listagem da Reporting. */
  async function listar<T>(
    url: string,
    campo: string,
    params: Record<string, string> = {},
  ): Promise<T[]> {
    const out: T[] = [];
    let pageToken: string | undefined;
    do {
      const qs = new URLSearchParams(params);
      if (pageToken) qs.set("pageToken", pageToken);
      const sufixo = qs.toString() ? `?${qs.toString()}` : "";
      const r = (await (await pedir(`${url}${sufixo}`)).json()) as Record<
        string,
        unknown
      > & { nextPageToken?: string };
      out.push(...((r[campo] as T[] | undefined) ?? []));
      pageToken = r.nextPageToken;
    } while (pageToken);
    return out;
  }

  /**
   * O job é o pedido permanente de "gere esse relatório todo dia". Criar dois
   * duplicaria os CSVs, então procura antes de criar.
   */
  async function garantirJob(): Promise<{ id: string; criado: boolean }> {
    const jobs = await listar<{ id: string; reportTypeId?: string }>(
      `${REPORTING_API}/jobs`,
      "jobs",
    );
    const existente = jobs.find((j) => j.reportTypeId === TIPO_ALCANCE);
    if (existente) return { id: existente.id, criado: false };

    const res = await pedir(`${REPORTING_API}/jobs`, {
      method: "POST",
      body: JSON.stringify({ reportTypeId: TIPO_ALCANCE, name: NOME_JOB }),
    });
    const novo = (await res.json()) as { id: string };
    return { id: novo.id, criado: true };
  }

  /**
   * Relatórios que começam em `desde` ou depois. O dia do relatório é no
   * horário do Pacífico (meia-noite = 07h/08h UTC), então `desde` à meia-noite
   * UTC pega o dia inteiro. Quando o YouTube refaz um dia (backfill), os dois
   * relatórios ficam listados: vale o de `createTime` mais novo.
   */
  async function relatoriosDaJanela(
    jobId: string,
    desde: string,
  ): Promise<RelatorioReporting[]> {
    const inicio = `${desde}T00:00:00Z`;
    const todos = await listar<RelatorioReporting>(
      `${REPORTING_API}/jobs/${encodeURIComponent(jobId)}/reports`,
      "reports",
      { startTimeAtOrAfter: inicio },
    );
    const porInicio = new Map<string, RelatorioReporting>();
    for (const r of todos) {
      if (Date.parse(r.startTime) < Date.parse(inicio)) continue;
      const atual = porInicio.get(r.startTime);
      if (!atual || (r.createTime ?? "") > (atual.createTime ?? "")) {
        porInicio.set(r.startTime, r);
      }
    }
    return [...porInicio.values()];
  }

  async function baixar(downloadUrl: string): Promise<string> {
    return (await pedir(downloadUrl)).text();
  }

  return { garantirJob, relatoriosDaJanela, baixar };
}

export type ClienteReporting = ReturnType<typeof criarClienteReporting>;

/** `20261011` (formato do CSV) ou `2026-10-11` → `2026-10-11`. */
function normalizarDia(v: string): string | null {
  const m = v.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * CSV do `channel_reach_basic_a1` → alcance por `videoId|dia`. As colunas
 * saem do header porque a doc avisa que a ordem não é fixa e que métrica
 * nova pode aparecer. O CTR vem como fração (cliques ÷ impressões) e sai em
 * %, a mesma unidade do `averageViewPercentage` gravado ao lado.
 */
export function parseAlcance(csv: string): Map<string, Alcance> {
  const linhas = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  const out = new Map<string, Alcance>();
  if (linhas.length < 2) return out;

  const celulas = (l: string) =>
    l.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
  const header = celulas(linhas[0]);
  const col = (nome: string) => header.indexOf(nome);
  const iDia = col("date");
  const iVideo = col("video_id");
  const iImp = col("video_thumbnail_impressions");
  const iCtr = col("video_thumbnail_impressions_ctr");
  if (iDia < 0 || iVideo < 0) return out;

  // Acumula por chave: impressões somadas e cliques estimados (imp × ctr)
  // para o CTR sair ponderado se o vídeo vier em mais de uma linha no dia.
  const acc = new Map<
    string,
    { imp: number | null; impComCtr: number; cliques: number }
  >();
  for (const l of linhas.slice(1)) {
    const c = celulas(l);
    const video = c[iVideo];
    const dia = normalizarDia(c[iDia] ?? "");
    if (!video || !dia) continue;
    const k = `${video}|${dia}`;
    const a = acc.get(k) ?? { imp: null, impComCtr: 0, cliques: 0 };
    const imp = iImp < 0 ? null : numOuNull(c[iImp]);
    const ctr = iCtr < 0 ? null : numOuNull(c[iCtr]);
    if (imp != null) {
      a.imp = (a.imp ?? 0) + imp;
      if (ctr != null) {
        a.impComCtr += imp;
        a.cliques += imp * ctr;
      }
    }
    acc.set(k, a);
  }

  for (const [k, a] of acc) {
    out.set(k, {
      impressions: a.imp,
      ctr: a.impComCtr > 0 ? (a.cliques / a.impComCtr) * 100 : null,
    });
  }
  return out;
}
