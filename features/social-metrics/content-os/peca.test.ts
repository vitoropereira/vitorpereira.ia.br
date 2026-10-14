import { describe, expect, it } from "vitest";
import { normalizarData, parsearPeca, slugDoCaminho } from "./peca";

const CAMINHO = "content/producao/2026-10/2026-10-11-meu-video.md";

function md(frontmatter: string): string {
  return `---\n${frontmatter}\n---\n\nCorpo da peça.\n`;
}

describe("parsearPeca", () => {
  it("lê os campos de interesse e usa o nome do arquivo como slug", () => {
    const r = parsearPeca(
      CAMINHO,
      md(
        [
          "plataforma: youtube",
          "formato: talking-head",
          "pauta: Pauta X",
          "hook: Você erra isso",
          "template: T1",
          "testa: gancho",
          "created: 2026-10-11",
          "youtube_id: abcDEF12345",
          "status: roteiro",
        ].join("\n"),
      ),
    );
    expect(r).toEqual({
      peca: {
        slug: "2026-10-11-meu-video",
        plataforma: "youtube",
        formato: "talking-head",
        pauta: "Pauta X",
        hook: "Você erra isso",
        template: "T1",
        testa: "gancho",
        created: "2026-10-11",
        publicado: null,
        youtube_id: "abcDEF12345",
        instagram_id: null,
      },
    });
  });

  it("created em Date do YAML vira AAAA-MM-DD em UTC", () => {
    const r = parsearPeca(
      CAMINHO,
      md("created: 2026-10-11\npublicado: 2026-10-13"),
    );
    expect(r).toMatchObject({
      peca: { created: "2026-10-11", publicado: "2026-10-13" },
    });
  });

  it("created com horário em UTC usa o dia UTC", () => {
    expect(normalizarData(new Date("2026-10-11T23:30:00Z"))).toBe("2026-10-11");
    expect(normalizarData("2026-10-11")).toBe("2026-10-11");
    expect(normalizarData("2026-02-31")).toBeUndefined();
    expect(normalizarData("ontem")).toBeUndefined();
  });

  it("YAML inválido devolve aviso e não lança", () => {
    const r = parsearPeca(CAMINHO, md("plataforma: [youtube\n  : :"));
    expect(r).toHaveProperty("aviso");
    expect((r as { aviso: string }).aviso).toContain("2026-10-11-meu-video");
  });

  it("frontmatter em js não executa código", () => {
    const r = parsearPeca(
      CAMINHO,
      '---js\n({ plataforma: "youtube", x: process.exit(9) })\n---\n',
    );
    expect(r).toHaveProperty("aviso");
  });

  it.each([
    ["plataforma: tiktok", /plataforma/],
    ["youtube_id: 12345", /youtube_id/],
    ["instagram_id: [a]", /instagram_id/],
    ["hook: 42", /hook/],
    ["created: ontem", /created/],
    ['created: "2026-13-45"', /created/],
    ["publicado: 99", /publicado/],
  ])("%s é rejeitado com aviso", (linha, padrao) => {
    const r = parsearPeca(CAMINHO, md(linha));
    expect(r).toHaveProperty("aviso");
    expect((r as { aviso: string }).aviso).toMatch(padrao);
  });

  it("guarda o texto como string pura, sem interpretar", () => {
    const r = parsearPeca(
      CAMINHO,
      md('hook: "<script>alert(1)</script> {{x}}"'),
    );
    expect(r).toMatchObject({
      peca: { hook: "<script>alert(1)</script> {{x}}" },
    });
  });

  it("arquivo sem frontmatter vira peça só com slug", () => {
    expect(parsearPeca(CAMINHO, "só texto")).toMatchObject({
      peca: { slug: "2026-10-11-meu-video", youtube_id: null, created: null },
    });
  });
});

describe("slugDoCaminho", () => {
  it("tira a pasta e o .md", () => {
    expect(slugDoCaminho(CAMINHO)).toBe("2026-10-11-meu-video");
  });
});
