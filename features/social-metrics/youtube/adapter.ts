import {
  DIAS_REPROCESSADOS,
  diaSaoPaulo,
  diasEntre,
  ehSegunda,
  somarDias,
  ultimosDias,
} from "../dia.ts";
import type {
  ColetaConta,
  ColetaPosts,
  ContaDiaria,
  Fetch,
  Job,
  MetricaDiaria,
  SocialAdapter,
} from "../types.ts";
import { ErroApi, erroDaResposta } from "./http.ts";
import {
  aplicarLinhaAnalytics,
  linhasPorNome,
  metricaVazia,
  numOuNull,
  postDoVideo,
  type RelatorioApi,
  type VideoApi,
} from "./normalizar.ts";
import { criarClienteReporting, parseAlcance } from "./reporting.ts";

export { ErroApi };

const DATA_API = "https://www.googleapis.com/youtube/v3";
const ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2/reports";

// Vídeo velho quase não muda; atualizar a série dele só na segunda poupa cota.
export const IDADE_MAX_DIARIA = 90;

const METRICAS_BASE =
  "views,estimatedMinutesWatched,averageViewPercentage,subscribersGained";

interface CanalApi {
  id: string;
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
}

export interface OpcoesAdapterYouTube {
  fetch: Fetch;
  accessToken: string;
  /** Dia de referência (Brasília). Default: hoje. */
  hoje?: string;
}

export function criarAdapterYouTube(
  opcoes: OpcoesAdapterYouTube,
): SocialAdapter {
  const { fetch, accessToken } = opcoes;
  const hoje = opcoes.hoje ?? diaSaoPaulo(new Date());

  async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw await erroDaResposta(res, "YouTube API");
    return (await res.json()) as T;
  }

  function relatorio(params: Record<string, string>): Promise<RelatorioApi> {
    const qs = new URLSearchParams({ ids: "channel==MINE", ...params });
    return get<RelatorioApi>(`${ANALYTICS_API}?${qs.toString()}`);
  }

  let canal: Promise<CanalApi> | null = null;
  function obterCanal(): Promise<CanalApi> {
    canal ??= get<{ items?: CanalApi[] }>(
      `${DATA_API}/channels?part=contentDetails,statistics&mine=true`,
    ).then((r) => {
      const c = r.items?.[0];
      if (!c) throw new Error("YouTube: nenhum canal ligado a esta conta.");
      return c;
    });
    return canal;
  }

  async function listarVideos(): Promise<VideoApi[]> {
    const c = await obterCanal();
    const uploads = c.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) throw new Error("YouTube: canal sem playlist de uploads.");

    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const qs = new URLSearchParams({
        part: "contentDetails",
        playlistId: uploads,
        maxResults: "50",
      });
      if (pageToken) qs.set("pageToken", pageToken);
      const r = await get<{
        items?: { contentDetails?: { videoId?: string } }[];
        nextPageToken?: string;
      }>(`${DATA_API}/playlistItems?${qs.toString()}`);
      for (const it of r.items ?? []) {
        if (it.contentDetails?.videoId) ids.push(it.contentDetails.videoId);
      }
      pageToken = r.nextPageToken;
    } while (pageToken);

    const videos: VideoApi[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const qs = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: ids.slice(i, i + 50).join(","),
      });
      const r = await get<{ items?: VideoApi[] }>(
        `${DATA_API}/videos?${qs.toString()}`,
      );
      videos.push(...(r.items ?? []));
    }
    return videos;
  }

  /** Janelas de no máximo um ano, para o backfill não estourar o relatório. */
  function janelas(de: string, ate: string): [string, string][] {
    const out: [string, string][] = [];
    let ini = de;
    while (ini <= ate) {
      const teto = somarDias(ini, 364);
      const fim = teto < ate ? teto : ate;
      out.push([ini, fim]);
      ini = somarDias(fim, 1);
    }
    return out;
  }

  async function coletarPosts(
    desde: string,
    job: Job = "collect",
  ): Promise<ColetaPosts> {
    const videos = await listarVideos();
    const posts = videos.map(postDoVideo);
    const avisos: string[] = [];
    const segunda = ehSegunda(hoje);

    const serie = videos.filter((v) => {
      const pub = v.snippet?.publishedAt;
      if (!pub) return false;
      const diaPub = diaSaoPaulo(new Date(pub));
      if (diaPub > hoje) return false;
      if (job === "backfill") return true;
      return segunda || diasEntre(diaPub, hoje) <= IDADE_MAX_DIARIA;
    });

    const porChave = new Map<string, MetricaDiaria>();
    const linha = (id: string, dia: string): MetricaDiaria => {
      const k = `${id}|${dia}`;
      let m = porChave.get(k);
      if (!m) {
        m = metricaVazia(id, dia);
        porChave.set(k, m);
      }
      return m;
    };
    const aplicar = (id: string, l: Record<string, unknown>) => {
      const dia = String(l.day);
      porChave.set(`${id}|${dia}`, aplicarLinhaAnalytics(linha(id, dia), l));
    };

    const inicioDe = (v: VideoApi) => {
      const diaPub = diaSaoPaulo(new Date(v.snippet!.publishedAt!));
      return diaPub > desde ? diaPub : desde;
    };

    // Base, uma consulta por vídeo. `day,video` numa consulta só não é
    // combinação documentada, e o relatório por `video` é um top-N: com 200 ele
    // pode cortar vídeos sem avisar, e a série perderia linha em silêncio.
    for (const v of serie) {
      for (const [ini, fim] of janelas(inicioDe(v), hoje)) {
        const r = await relatorio({
          startDate: ini,
          endDate: fim,
          metrics: METRICAS_BASE,
          dimensions: "day",
          filters: `video==${v.id}`,
          sort: "day",
        });
        for (const l of linhasPorNome(r)) aplicar(v.id, l);
      }
    }

    // Tráfego vai separado: se a API recusar a dimensão, só ela fica de fora e
    // o resto da coleta segue.
    let trafegoOk = true;
    for (const v of serie) {
      for (const [ini, fim] of janelas(inicioDe(v), hoje)) {
        if (trafegoOk) {
          try {
            const r = await relatorio({
              startDate: ini,
              endDate: fim,
              metrics: "views",
              dimensions: "day,insightTrafficSourceType",
              filters: `video==${v.id}`,
            });
            for (const l of linhasPorNome(r)) {
              const m = linha(v.id, String(l.day));
              const trafego = (m.extra.trafego ?? {}) as Record<string, number>;
              const views = numOuNull(l.views);
              if (views != null) {
                trafego[String(l.insightTrafficSourceType)] = views;
              }
              m.extra = { ...m.extra, trafego };
            }
          } catch (e) {
            if (!(e instanceof ErroApi && e.status === 400)) throw e;
            trafegoOk = false;
            avisos.push(
              `tráfego recusado (insightTrafficSourceType): ${e.message}`,
            );
          }
        }
      }
    }

    // likes/comments do `statistics` são acumulados até agora: só cabem na
    // linha de hoje. Nos dias reprocessados ficam null e o gravador preserva o
    // valor antigo.
    for (const v of serie) {
      const m = linha(v.id, hoje);
      m.likes = numOuNull(v.statistics?.likeCount);
      m.comments = numOuNull(v.statistics?.commentCount);
      const total = numOuNull(v.statistics?.viewCount);
      if (total != null) m.extra = { ...m.extra, views_total: total };
    }

    if (serie.length > 0) await aplicarAlcance(desde, porChave, avisos);

    return { posts, metricas: [...porChave.values()], avisos };
  }

  /**
   * Impressões e CTR da thumb vêm da Reporting API (o Analytics v2 não tem
   * essas métricas). Só preenche chave que a série já montou: o gravador
   * grava views e watch_time sem coalesce, e uma linha nova só com impressões
   * apagaria esses campos. Recusa da API vira aviso; impressões ficam null.
   */
  async function aplicarAlcance(
    desde: string,
    porChave: Map<string, MetricaDiaria>,
    avisos: string[],
  ): Promise<void> {
    const reporting = criarClienteReporting({ fetch, accessToken });
    try {
      const job = await reporting.garantirJob();
      if (job.criado) {
        avisos.push(
          `alcance: job da Reporting criado (${job.id}); relatórios em até ~48h`,
        );
        return;
      }
      const rels = await reporting.relatoriosDaJanela(job.id, desde);
      if (rels.length === 0) {
        avisos.push(`alcance: job ${job.id} ainda sem relatório na janela`);
        return;
      }
      for (const rel of rels) {
        const alcance = parseAlcance(await reporting.baixar(rel.downloadUrl));
        for (const [k, v] of alcance) {
          const m = porChave.get(k);
          if (!m) continue;
          m.impressions = v.impressions;
          m.ctr = v.ctr;
        }
      }
    } catch (e) {
      if (!(e instanceof ErroApi)) throw e;
      avisos.push(`alcance indisponível (Reporting API): ${e.message}`);
    }
  }

  async function coletarConta(dia: string): Promise<ColetaConta> {
    const c = await obterCanal();
    const oculto = c.statistics?.hiddenSubscriberCount === true;
    const seguidoresHoje = oculto
      ? null
      : numOuNull(c.statistics?.subscriberCount);

    const dias = ultimosDias(dia, DIAS_REPROCESSADOS);
    const r = await relatorio({
      startDate: dias[0],
      endDate: dia,
      metrics: "views,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    });
    const porDia = new Map(linhasPorNome(r).map((l) => [String(l.day), l]));

    const contas: ContaDiaria[] = dias.map((d) => {
      const l = porDia.get(d);
      const extra: Record<string, unknown> = {};
      const ganhos = numOuNull(l?.subscribersGained);
      const perdidos = numOuNull(l?.subscribersLost);
      if (ganhos != null) extra.subs_gained = ganhos;
      if (perdidos != null) extra.subs_lost = perdidos;
      return {
        rede: "youtube",
        dia: d,
        // subscriberCount é o total de agora: gravá-lo nos dias passados
        // sobrescreveria o número real daquele dia.
        seguidores: d === dia ? seguidoresHoje : null,
        views_dia: numOuNull(l?.views),
        alcance_dia: null,
        extra,
      };
    });
    return { contas, avisos: [] };
  }

  return { rede: "youtube", coletarConta, coletarPosts };
}
