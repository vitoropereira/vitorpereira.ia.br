// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PontoSeguidores } from "../queries/painel";
import { GraficoSeguidores, LEGENDA_RECONSTRUIDO } from "./GraficoSeguidores";
import { pontosSeguidores } from "./formato";

const ponto = (over: Partial<PontoSeguidores>): PontoSeguidores => ({
  dia: "2026-10-14",
  youtube: null,
  instagram: null,
  youtube_calc: null,
  instagram_calc: null,
  ...over,
});

describe("pontosSeguidores", () => {
  it("usa o real quando existe e só cai no reconstruído sem ele", () => {
    const dados = pontosSeguidores(
      [
        ponto({ dia: "2026-10-11", youtube_calc: 95 }),
        // Os dois no mesmo dia: o real vence e o reconstruído some.
        ponto({ dia: "2026-10-12", youtube: 100, youtube_calc: 98 }),
        ponto({ dia: "2026-10-13" }),
        ponto({ dia: "2026-10-14", instagram: 7, instagram_calc: 3 }),
      ],
      "youtube",
    );
    expect(dados).toEqual([
      { dia: "2026-10-11", valor: null, reconstruido: 95 },
      { dia: "2026-10-12", valor: 100, reconstruido: null },
      { dia: "2026-10-13", valor: null, reconstruido: null },
      { dia: "2026-10-14", valor: null, reconstruido: null },
    ]);
  });
});

describe("GraficoSeguidores", () => {
  it("mostra a legenda do reconstruído só quando há ponto reconstruído", () => {
    const com = renderToStaticMarkup(
      <GraficoSeguidores
        rede="youtube"
        dados={[{ dia: "2026-10-11", valor: null, reconstruido: 95 }]}
      />,
    );
    expect(com).toContain(LEGENDA_RECONSTRUIDO);

    const sem = renderToStaticMarkup(
      <GraficoSeguidores
        rede="youtube"
        dados={[{ dia: "2026-10-12", valor: 100, reconstruido: null }]}
      />,
    );
    expect(sem).not.toContain(LEGENDA_RECONSTRUIDO);
  });
});
