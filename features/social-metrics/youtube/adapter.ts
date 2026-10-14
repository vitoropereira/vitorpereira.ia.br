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
import {
  aplicarLinhaAnalytics,
  linhasPorNome,
  metricaVazia,
  numOuNull,
  postDoVideo,
  type RelatorioApi,
  type VideoApi,
} from "./normalizar.ts";

const DATA_API = "https://www.googleapis.com/youtube/v3";
const ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2/reports";

// Vídeo velho quase não muda; atualizar a série dele só na segunda poupa cota.
export const IDADE_MAX_DIARIA = 90;

const METRICAS_BASE =
  "views,estimatedMinutesWatched,averageViewPercentage,subscribersGained";
const METRICAS_IMPRESSAO =
  "videoThumbnailImpressions,videoThumbnailImpressionsClickRate";

export class ErroApi extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
  }
}

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
    if (!res.ok) {
      // Só a mensagem do Google: a URL e os headers ficam fora do erro.
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const msg = json.error?.message ?? "sem mensagem";
      throw new ErroApi(res.status, `YouTube API HTTP ${res.status}: ${msg}`);
    }
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
      const fim = somarDias(ini, 364) < ate ? somarDias(ini, 364) : ate;
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

    // Base. No collect tenta `day,video` numa consulta só; a documentação não
    // garante essa combinação, então o 400 cai para uma consulta por vídeo.
    let baseFeita = false;
    if (job === "collect" && serie.length > 0) {
      try {
        const r = await relatorio({
          startDate: desde,
          endDate: hoje,
          metrics: METRICAS_BASE,
          dimensions: "day,video",
          sort: "day",
        });
        const ids = new Set(serie.map((v) => v.id));
        for (const l of linhasPorNome(r)) {
          if (ids.has(String(l.video))) aplicar(String(l.video), l);
        }
        baseFeita = true;
      } catch (e) {
        if (!(e instanceof ErroApi && e.status === 400)) throw e;
      }
    }
    if (!baseFeita) {
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
    }

    // Impressões e tráfego vão separados: se a API recusar a métrica, só ela
    // fica null e o resto da coleta segue.
    let impressaoOk = true;
    let trafegoOk = true;
    for (const v of serie) {
      for (const [ini, fim] of janelas(inicioDe(v), hoje)) {
        if (impressaoOk) {
          try {
            const r = await relatorio({
              startDate: ini,
              endDate: fim,
              metrics: METRICAS_IMPRESSAO,
              dimensions: "day",
              filters: `video==${v.id}`,
            });
            for (const l of linhasPorNome(r)) aplicar(v.id, l);
          } catch (e) {
            if (!(e instanceof ErroApi && e.status === 400)) throw e;
            impressaoOk = false;
            avisos.push(
              `impressões recusadas (${METRICAS_IMPRESSAO}): ${e.message}`,
            );
          }
        }
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

    return { posts, metricas: [...porChave.values()], avisos };
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
        seguidores: d === hoje ? seguidoresHoje : null,
        views_dia: numOuNull(l?.views),
        alcance_dia: null,
        extra,
      };
    });
    return { contas, avisos: [] };
  }

  return { rede: "youtube", coletarConta, coletarPosts };
}
