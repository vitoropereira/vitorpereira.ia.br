import { describe, expect, it } from "vitest";
import { parsearMetas } from "./metas";

describe("parsearMetas", () => {
  it("lê metas válidas, com vigente_desde normalizada", () => {
    const r = parsearMetas(
      [
        "- rede: youtube",
        "  tipo: short",
        "  por_semana: 3",
        "  vigente_desde: 2026-10-01",
        "- rede: instagram",
        "  tipo: carrossel",
        "  por_semana: 1.5",
        "  vigente_desde: 2026-10-01",
      ].join("\n"),
    );
    expect(r.avisos).toEqual([]);
    expect(r.metas).toEqual([
      {
        rede: "youtube",
        tipo: "short",
        por_semana: 3,
        vigente_desde: "2026-10-01",
      },
      {
        rede: "instagram",
        tipo: "carrossel",
        por_semana: 1.5,
        vigente_desde: "2026-10-01",
      },
    ]);
  });

  it("rejeita a entrada inválida e mantém as válidas", () => {
    const r = parsearMetas(
      [
        "- rede: youtube",
        "  tipo: short",
        "  por_semana: 3",
        "  vigente_desde: 2026-10-01",
        "- rede: tiktok",
        "  tipo: short",
        "  por_semana: 3",
        "  vigente_desde: 2026-10-01",
        "- rede: youtube",
        "  tipo: podcast",
        "  por_semana: 3",
        "  vigente_desde: 2026-10-01",
        "- rede: youtube",
        "  tipo: longo",
        "  por_semana: 0",
        "  vigente_desde: 2026-10-01",
        "- rede: youtube",
        "  tipo: longo",
        "  por_semana: '2'",
        "  vigente_desde: 2026-10-01",
        "- rede: youtube",
        "  tipo: longo",
        "  por_semana: 2",
        "  vigente_desde: ontem",
        "- 42",
      ].join("\n"),
    );
    expect(r.metas).toHaveLength(1);
    expect(r.avisos).toHaveLength(6);
  });

  it("chave repetida gera aviso", () => {
    const item =
      "- rede: youtube\n  tipo: short\n  por_semana: 3\n  vigente_desde: 2026-10-01";
    const r = parsearMetas(`${item}\n${item}`);
    expect(r.avisos[0]).toMatch(/repetida/);
  });

  it("YAML quebrado rejeita tudo com aviso", () => {
    const r = parsearMetas("- rede: [youtube\n  : :");
    expect(r.metas).toEqual([]);
    expect(r.avisos[0]).toMatch(/YAML inválido/);
  });

  it("raiz que não é lista rejeita tudo", () => {
    const r = parsearMetas("rede: youtube\ntipo: short");
    expect(r.metas).toEqual([]);
    expect(r.avisos[0]).toMatch(/lista/);
  });

  it("arquivo vazio rejeita com aviso", () => {
    const r = parsearMetas("");
    expect(r.metas).toEqual([]);
    expect(r.avisos).toHaveLength(1);
  });
});
