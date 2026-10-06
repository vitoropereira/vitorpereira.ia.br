import { render } from "@testing-library/react";
import { CaseStudies } from "./CaseStudies";

// Sem post (ou sem capa) a seção precisa degradar para o bloco com a tag.
vi.mock("@/features/blog/lib/queries", () => ({
  getPostBySlug: () => undefined,
}));

describe("CaseStudies sem capa", () => {
  it("renderiza fallback sem imagem e sem lançar", () => {
    const { container } = render(<CaseStudies locale="pt" />);
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(container.querySelectorAll("article").length).toBe(5);
  });
});
