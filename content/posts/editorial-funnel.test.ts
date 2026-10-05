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
    expect(body).toContain('<DiagnosticCTA locale="pt">');
  });

  it("publica o complemento operacional do vídeo sobre agentes", () => {
    const article = postBody("09/13", "agente-nao-amadurece-no-prompt");

    expect(article).toContain('<Video id="DjAUEtUpdbM"');
    expect(article).toContain("](/2026/07/18/arquitetura-mental-do-agente)");
    expect(article).toContain("](/2026/07/25/ferramentas-como-contrato)");
    expect(article).toContain("](/2026/08/15/limites-do-agente)");
    expect(article).toContain('<DiagnosticCTA locale="pt">');
  });

  it("publica o guia de logs como próximo passo verificável da série", () => {
    const article = postBody("09/17", "logs-para-operar-agentes");

    expect(article).toContain("date: 2026-09-17T10:00:00-03:00");
    expect(article).toContain("draft: false");
    expect(article).toContain("](/2026/07/25/ferramentas-como-contrato)");
    expect(article).toContain("](/2026/08/06/fila-que-guarda-o-payload-cru)");
    expect(article).toContain("](/2026/08/15/limites-do-agente)");
    expect(article).toContain('<DiagnosticCTA locale="pt">');
    expect(article).toContain("https://www.w3.org/TR/trace-context/");
    expect(article).toContain(
      "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
    );
  });

  it("publica idempotência como controle do efeito externo", () => {
    const article = postBody("09/21", "idempotencia-efeito-externo");

    expect(article).toContain("date: 2026-09-21T11:00:00-03:00");
    expect(article).toContain("draft: false");
    expect(article).toContain("](/2026/09/17/logs-para-operar-agentes)");
    expect(article).toContain("](/2026/08/06/fila-que-guarda-o-payload-cru)");
    expect(article).toContain("](/2026/08/15/limites-do-agente)");
    expect(article).toContain('<DiagnosticCTA locale="pt">');
    expect(article.match(/<DiagnosticCTA/g)).toHaveLength(1);
    expect(article).toContain(
      "https://docs.stripe.com/api/idempotent_requests",
    );
  });

  it("publica o contrato editorial de MDX como rota pública", () => {
    const article = postBody("10/01", "mdx-nao-e-so-texto");

    expect(article).toContain("date: 2026-10-01T11:00:00-03:00");
    expect(article).toContain("draft: false");
    expect(article).toContain("](/2026/09/21/idempotencia-efeito-externo)");
    expect(article).toContain('<DiagnosticCTA locale="pt">');
    expect(article.match(/<DiagnosticCTA/g)).toHaveLength(1);
    expect(article).toContain(
      "https://github.com/vitoropereira/vitorpereira.ia.br/blob/c2f088062436e70ebf51c76f8197ce85419a9ddc/velite.config.ts",
    );
    expect(article).toContain(
      "https://github.com/vitoropereira/vitorpereira.ia.br/blob/c2f088062436e70ebf51c76f8197ce85419a9ddc/features/blog/lib/visibility.ts",
    );
  });

  it("publica read-only como contrato, não como promessa de segurança", () => {
    const article = postBody("10/05", "read-only-nao-e-politica-de-seguranca");

    expect(article).toContain("date: 2026-10-05T11:00:00-03:00");
    expect(article).toContain("draft: false");
    expect(article).toContain("](/2026/07/25/ferramentas-como-contrato)");
    expect(article).toContain('<DiagnosticCTA locale="pt">');
    expect(article.match(/<DiagnosticCTA/g)).toHaveLength(1);
    expect(article).toContain(
      "https://modelcontextprotocol.io/specification/2025-11-25/server/tools",
    );
    expect(article).toContain(
      "https://github.com/vitoropereira/vitorpereira.ia.br/blob/9377f9b3cb74ad044c073dd0d533735e9094b02e/app/api/mcp/route.ts",
    );
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
    expect(tools).toContain('<DiagnosticCTA locale="en">');
    expect(tools).not.toContain("what the logs have to show");
  });
});
