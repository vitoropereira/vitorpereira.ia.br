import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagChips, shouldFeatureFirst, rankTagsByFrequency } from "./TagChips";

describe("TagChips", () => {
  it("monta hrefs PT com encodeURIComponent (tag acentuada)", () => {
    render(<TagChips tags={["segurança", "agentes"]} locale="pt" />);
    expect(screen.getByRole("link", { name: "#segurança" })).toHaveAttribute(
      "href",
      "/tags/seguran%C3%A7a",
    );
    expect(screen.getByRole("link", { name: "#agentes" })).toHaveAttribute(
      "href",
      "/tags/agentes",
    );
  });

  it("monta hrefs EN com prefixo /en", () => {
    render(<TagChips tags={["segurança"]} locale="en" />);
    expect(screen.getByRole("link", { name: "#segurança" })).toHaveAttribute(
      "href",
      "/en/tags/seguran%C3%A7a",
    );
  });

  it("marca só o ativo com aria-current=page", () => {
    render(<TagChips tags={["a", "b"]} locale="pt" active="b" />);
    expect(screen.getByRole("link", { name: "#b" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "#a" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("limita a 12 chips", () => {
    const tags = Array.from({ length: 15 }, (_, i) => `t${i}`);
    render(<TagChips tags={tags} locale="pt" />);
    expect(screen.getAllByRole("link")).toHaveLength(12);
  });

  it("tag ativa fora do top 12 substitui o último chip (mantém 12)", () => {
    const tags = Array.from({ length: 15 }, (_, i) => `t${i}`);
    render(<TagChips tags={tags} locale="pt" active="t14" />);
    expect(screen.getAllByRole("link")).toHaveLength(12);
    expect(screen.getByRole("link", { name: "#t14" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "#t11" })).toBeNull();
  });

  it("tag ativa acentuada fora do top 12 aparece (compara decodificada)", () => {
    const tags = [
      ...Array.from({ length: 12 }, (_, i) => `t${i}`),
      "segurança",
    ];
    render(<TagChips tags={tags} locale="pt" active="segurança" />);
    expect(screen.getByRole("link", { name: "#segurança" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("não renderiza nada sem tags", () => {
    const { container } = render(<TagChips tags={[]} locale="pt" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("rankTagsByFrequency", () => {
  it("ordena por frequência desc, empate alfabético", () => {
    const posts = [
      { tags: ["b", "a"] },
      { tags: ["b", "c"] },
      { tags: ["c"] },
      {},
    ];
    expect(rankTagsByFrequency(posts)).toEqual(["b", "c", "a"]);
  });
});

describe("shouldFeatureFirst", () => {
  it("destaca só na página 1", () => {
    expect(shouldFeatureFirst(1)).toBe(true);
    expect(shouldFeatureFirst(2)).toBe(false);
    expect(shouldFeatureFirst(7)).toBe(false);
  });
});
