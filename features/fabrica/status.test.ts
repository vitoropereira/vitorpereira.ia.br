import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { carregarStatus } from "./status";

const fetchMock = vi.fn();
const agora = new Date("2026-11-11T12:00:00Z");

const resposta = (corpo: unknown, ok = true) => ({
  ok,
  json: async () => corpo,
});

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FACTORY_GITHUB_TOKEN", "tok");
  vi.stubEnv("FACTORY_STATUS_REPO", "");
  vi.stubEnv("FACTORY_STATUS_BRANCH", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("carregarStatus", () => {
  it("sem token não chama o fetch", async () => {
    vi.stubEnv("FACTORY_GITHUB_TOKEN", "");
    expect(await carregarStatus(agora)).toEqual({ erro: "sem-token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["404", () => fetchMock.mockResolvedValue(resposta({}, false))],
    [
      "rede",
      () => fetchMock.mockRejectedValue(new Error("ECONNRESET api.github.com")),
    ],
  ])("falha (%s) vira indisponivel sem a mensagem crua", async (_, prep) => {
    prep();
    const r = await carregarStatus(agora);
    expect(r).toEqual({ erro: "indisponivel" });
    expect(JSON.stringify(r)).not.toContain("github");
  });

  it("JSON válido vira dados tipados, com idade e velho", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        gerado_em: "2026-11-11T11:00:00Z",
        estacoes: [],
        itens: [{ titulo: "A", repo: "r", estacao: "gate" }],
        aguardando_dono: [],
        eventos: [{ em: "x", texto: "y" }],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.itens[0].titulo).toBe("A");
    expect(r.minutosDesde).toBe(60);
    expect(r.velho).toBe(true);
  });

  it("status recente não é velho", async () => {
    fetchMock.mockResolvedValue(
      resposta({ gerado_em: "2026-11-11T11:50:00Z", estacoes: [] }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.velho).toBe(false);
  });

  it("JSON sem estacoes é indisponivel", async () => {
    fetchMock.mockResolvedValue(resposta({ itens: [] }));
    expect(await carregarStatus(agora)).toEqual({ erro: "indisponivel" });
  });

  it("usa URL e headers corretos, com repo/branch padrão e por env", async () => {
    fetchMock.mockResolvedValue(resposta({ estacoes: [] }));
    await carregarStatus(agora);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/repos/vitoropereira/content-os/contents/status.json?ref=main",
    );
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers.Accept).toBe("application/vnd.github.raw+json");
    expect(init.cache).toBe("no-store");

    vi.stubEnv("FACTORY_STATUS_REPO", "o/r");
    vi.stubEnv("FACTORY_STATUS_BRANCH", "dev");
    await carregarStatus(agora);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.github.com/repos/o/r/contents/status.json?ref=dev",
    );
  });
});
