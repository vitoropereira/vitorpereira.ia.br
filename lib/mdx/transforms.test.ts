import { describe, it, expect } from "vitest";
import { calloutsToBlockquotes, videosToLinks, absolutizeInternalLinks } from "./transforms.ts";

describe("calloutsToBlockquotes", () => {
  it("converte Callout note em citação com rótulo", () => {
    expect(calloutsToBlockquotes(`<Callout type="note">\n  Texto do aviso.\n</Callout>`)).toBe("> **Nota:** Texto do aviso.");
  });
  it("mapeia warn e info", () => {
    expect(calloutsToBlockquotes(`<Callout type="warn">Cuidado.</Callout>`)).toBe("> **Atenção:** Cuidado.");
    expect(calloutsToBlockquotes(`<Callout type="info">Fyi.</Callout>`)).toBe("> **Info:** Fyi.");
  });
});

describe("videosToLinks", () => {
  it("troca <Video id> por link do YouTube", () => {
    expect(videosToLinks(`<Video id="abc123" />`)).toBe("[Assista no YouTube](https://youtu.be/abc123)");
  });
});

describe("absolutizeInternalLinks", () => {
  it("prefixa links internos", () => {
    const src = "veja o [texto anterior](/2026/05/31/chatbot-nao-e-agente) aqui";
    expect(absolutizeInternalLinks(src, "https://vitorpereira.ia.br")).toBe(
      "veja o [texto anterior](https://vitorpereira.ia.br/2026/05/31/chatbot-nao-e-agente) aqui",
    );
  });
  it("não toca em externos", () => {
    expect(absolutizeInternalLinks("[x](https://exemplo.com)", "https://vitorpereira.ia.br")).toBe("[x](https://exemplo.com)");
  });
});
