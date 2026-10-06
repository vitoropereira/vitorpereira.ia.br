import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "./Reveal";
import { mockIntersectionObserver, mockMatchMedia } from "./testUtils";

describe("Reveal", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;

  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
    delete document.documentElement.dataset.motion;
  });
  afterEach(() => {
    io.restore();
    restoreMM();
  });

  it("renderiza os filhos no HTML desde o início", () => {
    render(<Reveal>conteúdo</Reveal>);
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("começa sem data-revealed e revela ao entrar na tela", () => {
    render(<Reveal>x</Reveal>);
    const el = screen.getByText("x");
    expect(el).toHaveAttribute("data-reveal", "fade-up");
    expect(el).not.toHaveAttribute("data-revealed");
    io.trigger(true);
    expect(el).toHaveAttribute("data-revealed");
  });

  it("revela quem já está na tela no primeiro callback (chegada por âncora)", () => {
    render(<Reveal>âncora</Reveal>);
    io.trigger(true);
    expect(screen.getByText("âncora")).toHaveAttribute("data-revealed");
  });

  it("não revela enquanto não intersecta e desconecta depois de revelar", () => {
    render(<Reveal>y</Reveal>);
    io.trigger(false);
    expect(screen.getByText("y")).not.toHaveAttribute("data-revealed");
    io.trigger(true);
    expect(io.instances[0].disconnected).toBe(true);
  });

  it("com reduced-motion revela de imediato", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    render(<Reveal>z</Reveal>);
    expect(screen.getByText("z")).toHaveAttribute("data-revealed");
  });

  it("sem IntersectionObserver revela de imediato", () => {
    const original = globalThis.IntersectionObserver;
    try {
      // @ts-expect-error simulando navegador antigo
      delete globalThis.IntersectionObserver;
      render(<Reveal>w</Reveal>);
      expect(screen.getByText("w")).toHaveAttribute("data-revealed");
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it("observa com threshold 0 e rootMargin 0 (blocos altos e fim da página)", () => {
    render(<Reveal>t</Reveal>);
    expect(io.instances[0].options).toEqual({
      threshold: 0,
      rootMargin: "0px",
    });
  });

  it("sinaliza ao boot script que a hidratação aconteceu", () => {
    render(<Reveal>k</Reveal>);
    expect(document.documentElement.dataset.motion).toBe("ready");
  });

  it("aplica delay como --reveal-delay e respeita as/variant", () => {
    render(
      <Reveal as="li" delay={120} variant="fade">
        d
      </Reveal>,
    );
    const el = screen.getByText("d");
    expect(el.tagName).toBe("LI");
    expect(el).toHaveAttribute("data-reveal", "fade");
    expect(el.style.getPropertyValue("--reveal-delay")).toBe("120ms");
  });
});
