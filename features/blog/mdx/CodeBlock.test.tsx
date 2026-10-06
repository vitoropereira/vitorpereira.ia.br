import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
  });
}

// jsdom não implementa innerText; o componente lê esse campo do <pre>.
Object.defineProperty(HTMLElement.prototype, "innerText", {
  get() {
    return this.textContent;
  },
  configurable: true,
});

beforeEach(() => {
  document.documentElement.lang = "pt-BR";
});

afterEach(() => {
  document.documentElement.lang = "";
  vi.useRealTimers();
});

const renderBlock = () =>
  render(
    <CodeBlock data-language="ts">
      <code>const a = 1;</code>
    </CodeBlock>,
  );

describe("CodeBlock", () => {
  it("copia o texto do pre e troca o rótulo para Copiado", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderBlock();
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    await act(async () => {});
    expect(writeText).toHaveBeenCalledWith("const a = 1;");
    expect(screen.getByRole("button", { name: "Copiado" })).toBeTruthy();
  });

  it("preserva atributos do pre", () => {
    const { container } = renderBlock();
    expect(container.querySelector("pre")?.getAttribute("data-language")).toBe(
      "ts",
    );
  });

  it("mostra Não copiou quando writeText rejeita", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("no")) });
    renderBlock();
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Não copiou" })).toBeTruthy();
  });

  it("mostra Não copiou sem navigator.clipboard", async () => {
    setClipboard(undefined);
    renderBlock();
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Não copiou" })).toBeTruthy();
  });

  it("usa rótulos em inglês quando html lang não é pt-BR", async () => {
    document.documentElement.lang = "en";
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    renderBlock();
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("volta ao estado inicial após 2s", async () => {
    vi.useFakeTimers();
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    renderBlock();
    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copiar código" })).toBeTruthy();
  });
});
