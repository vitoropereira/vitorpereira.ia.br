import { describe, expect, it } from "vitest";
import type { Fetch } from "../types";
import { criarLeitor } from "./leitor";

const TOKEN = "github_pat_SEGREDO123";

interface Chamada {
  url: string;
  init?: Parameters<Fetch>[1];
}

function resposta(status: number, corpo: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
    text: async () =>
      typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  };
}

/** Fake que falha o teste em qualquer coisa que não seja GET na API do GitHub. */
function fetchSoGet(
  rotas: (url: string) => ReturnType<typeof resposta>,
  chamadas: Chamada[] = [],
): Fetch {
  return async (url, init) => {
    chamadas.push({ url, init });
    if (init?.method !== undefined && init.method !== "GET") {
      throw new Error(`método proibido: ${init.method}`);
    }
    if (new URL(url).host !== "api.github.com") {
      throw new Error(`host proibido: ${url}`);
    }
    return rotas(url);
  };
}

describe("criarLeitor", () => {
  it("lista só as peças em content/producao/AAAA-MM/*.md", async () => {
    const chamadas: Chamada[] = [];
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(
        () =>
          resposta(200, {
            truncated: false,
            tree: [
              { path: "content/producao/2026-10/b.md", type: "blob" },
              { path: "content/producao/2026-10/a.md", type: "blob" },
              { path: "content/producao/2026-10/assets/x.md", type: "blob" },
              { path: "content/producao/2026-10/capa.png", type: "blob" },
              { path: "content/producao/2026-10", type: "tree" },
              { path: "content/producao/README.md", type: "blob" },
              { path: "content/metricas/metas.yml", type: "blob" },
            ],
          }),
        chamadas,
      ),
    });
    const r = await leitor.listarPecas();
    expect(r.caminhos).toEqual([
      "content/producao/2026-10/a.md",
      "content/producao/2026-10/b.md",
    ]);
    expect(r.aviso).toBeNull();
    expect(chamadas[0].url).toBe(
      "https://api.github.com/repos/vitoropereira/content-os/git/trees/main?recursive=1",
    );
    expect(chamadas[0].init?.headers?.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("árvore truncada vira aviso", async () => {
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(() => resposta(200, { truncated: true, tree: [] })),
    });
    expect((await leitor.listarPecas()).aviso).toMatch(/truncada/);
  });

  it("lê o arquivo cru com Accept raw e ref=main", async () => {
    const chamadas: Chamada[] = [];
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(() => resposta(200, "---\na: 1\n---\n"), chamadas),
    });
    expect(await leitor.lerArquivo("content/producao/2026-10/a.md")).toBe(
      "---\na: 1\n---\n",
    );
    expect(chamadas[0].url).toBe(
      "https://api.github.com/repos/vitoropereira/content-os/contents/content/producao/2026-10/a.md?ref=main",
    );
    expect(chamadas[0].init?.headers?.Accept).toBe(
      "application/vnd.github.raw",
    );
  });

  it("404 devolve null", async () => {
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(() => resposta(404, { message: "Not Found" })),
    });
    expect(await leitor.lerArquivo("content/metricas/metas.yml")).toBeNull();
  });

  it("só faz GET e só em api.github.com", async () => {
    const chamadas: Chamada[] = [];
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(
        (url) =>
          url.includes("/git/trees/")
            ? resposta(200, { tree: [] })
            : resposta(200, "x"),
        chamadas,
      ),
    });
    await leitor.listarPecas();
    await leitor.lerArquivo("content/producao/2026-10/a.md");
    expect(chamadas).toHaveLength(2);
    for (const c of chamadas) expect(c.init?.method).toBe("GET");
  });

  it("o fake de fato barra método diferente de GET", async () => {
    const f = fetchSoGet(() => resposta(200, ""));
    await expect(
      f("https://api.github.com/x", { method: "PUT" }),
    ).rejects.toThrow(/proibido/);
  });

  it("erro HTTP não vaza o token", async () => {
    const leitor = criarLeitor({
      token: TOKEN,
      fetch: fetchSoGet(() => resposta(401, { message: `Bad ${TOKEN}` })),
    });
    for (const fn of [
      () => leitor.listarPecas(),
      () => leitor.lerArquivo("content/producao/2026-10/a.md"),
    ]) {
      const e = await fn().catch((x: Error) => x);
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toMatch(/401/);
      expect((e as Error).message).not.toContain(TOKEN);
    }
  });
});
