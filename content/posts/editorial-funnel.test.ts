import { readFileSync } from "node:fs";
import { join } from "node:path";

const postsRoot = join(process.cwd(), "content/posts/2026");

function postBody(date: string, slug: string, filename = "index.mdx"): string {
  return readFileSync(join(postsRoot, date, slug, filename), "utf8");
}

describe("trilha editorial de agentes", () => {
  it("liga os artigos publicados na ordem da série", () => {
    expect(postBody("07/18", "arquitetura-mental-do-agente")).toContain(
      "](/2026/07/25/ferramentas-como-contrato)",
    );

    const tools = postBody("07/25", "ferramentas-como-contrato");
    expect(tools).toContain("](/2026/08/11/memoria-de-agente)");
    expect(tools).not.toContain("o que os logs precisam mostrar");

    expect(postBody("08/11", "memoria-de-agente")).toContain(
      "](/2026/08/13/avaliar-agente-quatro-eixos)",
    );

    expect(postBody("08/13", "avaliar-agente-quatro-eixos")).toContain(
      "](/2026/08/15/limites-do-agente)",
    );
  });

  it.each([
    ["07/25", "ferramentas-como-contrato"],
    ["08/13", "avaliar-agente-quatro-eixos"],
    ["08/15", "limites-do-agente"],
  ])("leva leitores de %s/%s ao diagnóstico", (date, slug) => {
    const body = postBody(date, slug);

    expect(body).toContain("## Próximo passo");
    expect(body).toContain("](/agendar/diagnostico-30min)");
  });

  it("preserva a passagem para ferramentas e diagnóstico na versão inglesa disponível", () => {
    expect(
      postBody("07/18", "arquitetura-mental-do-agente", "index.en.mdx"),
    ).toContain("](/en/2026/07/25/ferramentas-como-contrato)");

    const tools = postBody(
      "07/25",
      "ferramentas-como-contrato",
      "index.en.mdx",
    );
    expect(tools).toContain("## Next step");
    expect(tools).toContain("](/en/booking/diagnostico-30min)");
    expect(tools).not.toContain("what the logs have to show");
  });
});
