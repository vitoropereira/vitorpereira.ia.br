// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LinhaRanking } from "../queries/pecas";
import { TabelaPecas, urlExterna } from "./TabelaPecas";

const linha = (extra: Partial<LinhaRanking> = {}): LinhaRanking => ({
  id: "1",
  rede: "youtube",
  external_id: "AAAAAAAAAAA",
  url: "https://youtu.be/AAAAAAAAAAA",
  titulo: "Meu vídeo",
  tipo: "longo",
  publicadoEm: "2026-10-01T15:00:00Z",
  dia0: "2026-10-01",
  idade: 13,
  peca_slug: "2026-10-01-meu-video",
  pauta: "agentes",
  formato: null,
  template: null,
  d1: 10,
  d7: 70,
  d30: null,
  total: 90,
  likes: null,
  saves: null,
  ctr: null,
  retencao: null,
  ...extra,
});

describe("TabelaPecas", () => {
  it("o título leva à URL do post e a coluna peça mostra o slug", () => {
    const html = renderToStaticMarkup(<TabelaPecas linhas={[linha()]} />);
    expect(html).toContain('href="https://youtu.be/AAAAAAAAAAA"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(">Peça</th>");
    expect(html).toContain(
      'href="/admin/redes/pecas/2026-10-01-meu-video">2026-10-01-meu-video</a>',
    );
  });

  it("post sem peça diz isso na coluna e não linka a página da peça", () => {
    const html = renderToStaticMarkup(
      <TabelaPecas linhas={[linha({ peca_slug: null, pauta: null })]} />,
    );
    expect(html).toContain("sem peça");
    expect(html).not.toContain("/admin/redes/pecas/");
  });

  it("URL que não é http(s) não vira link", () => {
    const html = renderToStaticMarkup(
      <TabelaPecas linhas={[linha({ url: "javascript:alert(1)" })]} />,
    );
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Meu vídeo");
  });
});

describe("urlExterna", () => {
  it("aceita só http e https", () => {
    expect(urlExterna("https://x.com/a")).toBe("https://x.com/a");
    expect(urlExterna("http://x.com/a")).toBe("http://x.com/a");
    expect(urlExterna("javascript:alert(1)")).toBeNull();
    expect(urlExterna("não é url")).toBeNull();
    expect(urlExterna(null)).toBeNull();
  });
});
