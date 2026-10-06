import { render } from "@testing-library/react";
import { JsonLd } from "./JsonLd";

describe("JsonLd — Service", () => {
  it("descreve o Agente Operacional como serviço prestado pelo Vitor", () => {
    const { container } = render(
      <JsonLd
        data={{
          type: "Service",
          locale: "pt",
          name: "Agente Operacional de IA",
          description:
            "Implantação de um agente para executar um processo real.",
          url: "https://vitorpereira.ia.br/servicos/agente-operacional",
        }}
      />,
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const json = JSON.parse(script?.textContent ?? "{}");

    expect(json["@type"]).toBe("Service");
    expect(json.name).toBe("Agente Operacional de IA");
    expect(json.provider).toMatchObject({
      "@type": "Person",
      name: "Vitor Onofre Pereira",
    });
    expect(json.inLanguage).toBe("pt-BR");
  });
});

describe("JsonLd — FAQPage", () => {
  it("emite mainEntity com pergunta e resposta aceita", () => {
    const { container } = render(
      <JsonLd data={{ type: "FAQPage", items: [{ q: "Pergunta?", a: "Resposta." }] }} />,
    );
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? "{}",
    );
    expect(json["@type"]).toBe("FAQPage");
    expect(json.mainEntity[0].name).toBe("Pergunta?");
    expect(json.mainEntity[0].acceptedAnswer.text).toBe("Resposta.");
  });
});
