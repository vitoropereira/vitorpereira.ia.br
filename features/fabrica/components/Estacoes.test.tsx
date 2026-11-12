import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CORES } from "../cores";
import type { GrupoRepo } from "../status";
import { Estacoes } from "./Estacoes";

const estacoes = [
  { id: "construir", nome: "Construir" },
  { id: "porteiro", nome: "Porteiro" },
];

const repos: GrupoRepo[] = [
  {
    alias: "vp",
    repo: "o/site",
    resumo: {
      ativos: 2,
      entregues: 0,
      voltas: 0,
      ultimoDeploy: null,
      saude: "ok",
    },
    itens: [
      {
        titulo: "Painel",
        repo: "o/site",
        alias: "vp",
        n: 7,
        estacao: "construir",
      },
      {
        titulo: "Admin",
        repo: "o/site",
        alias: "vp",
        n: 9,
        estacao: "porteiro",
        aguarda: "ok do dono",
      },
    ],
  },
];

describe("Estacoes", () => {
  it("abre no kanban e alterna para a matriz com #n título por célula", () => {
    render(<Estacoes estacoes={estacoes} repos={repos} />);
    const kanban = screen.getByRole("button", { name: "Kanban" });
    const matriz = screen.getByRole("button", { name: "Repos × estações" });
    expect(kanban.getAttribute("aria-pressed")).toBe("true");
    expect(matriz.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("aguarda: ok do dono")).toBeTruthy();

    fireEvent.click(matriz);
    expect(matriz.getAttribute("aria-pressed")).toBe("true");
    const tabela = screen.getByRole("table");
    const linha = within(tabela).getByRole("row", { name: /vp/ });
    const cabecalho = within(linha).getByRole("rowheader");
    expect(cabecalho.className).toContain("sticky");
    expect(cabecalho.textContent).toContain("o/site");
    expect(within(linha).getByText("#7 Painel")).toBeTruthy();
    const comAguarda = within(linha).getByText("#9 Admin");
    // jsdom normaliza a cor para rgb.
    expect(comAguarda.style.color).toBe("rgb(251, 191, 36)");
    expect(CORES.esperaClaro).toBe("#fbbf24");
  });
});
