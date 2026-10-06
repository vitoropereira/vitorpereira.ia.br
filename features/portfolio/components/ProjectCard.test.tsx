import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard, domainOf } from "./ProjectCard";
import { projects } from "../data/projects";

const base = projects[0]!;

describe("domainOf", () => {
  it("tira protocolo, www e caminho", () => {
    expect(domainOf("https://www.sarcorps.com.br/pt")).toBe("sarcorps.com.br");
  });
  it("null para url ausente ou inválida", () => {
    expect(domainOf(null)).toBeNull();
    expect(domainOf("não é url")).toBeNull();
  });
});

describe("ProjectCard", () => {
  it("com cover e url mostra a moldura com o domínio", () => {
    render(
      <ProjectCard
        project={{ ...base, cover: "x.webp", url: "https://clearseg.com.br" }}
        locale="pt"
      />
    );
    expect(screen.getByText("clearseg.com.br")).toBeInTheDocument();
  });

  it("com cover e sem url renderiza a imagem sem domínio, sem lançar", () => {
    const { container } = render(
      <ProjectCard
        project={{ ...base, cover: "x.webp", url: null }}
        locale="pt"
      />
    );
    expect(container.querySelector("img")).not.toBeNull();
    expect(screen.queryByText("clearseg.com.br")).toBeNull();
  });

  it("sem cover renderiza placeholder na mesma moldura, sem img", () => {
    const { container } = render(
      <ProjectCard
        project={{ ...base, cover: null, url: "https://clearseg.com.br" }}
        locale="pt"
      />
    );
    expect(container.querySelector("[data-browser-frame]")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("clearseg.com.br")).toBeInTheDocument();
    // título: heading + decorativo aria-hidden
    expect(screen.getAllByText(base.title)).toHaveLength(2);
    expect(
      container.querySelector("[data-browser-frame] [aria-hidden='true']")
    ).not.toBeNull();
    expect(screen.getByRole("heading")).toHaveTextContent(base.title);
  });
});
