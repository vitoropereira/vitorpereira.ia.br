import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/posts" }));
vi.mock("./LangToggle", () => ({ LangToggle: () => <span>lang</span> }));
vi.mock("./ThemeToggle", () => ({ ThemeToggle: () => <span>theme</span> }));

import { MobileNav } from "./MobileNav";

const items = [
  { href: "/posts", label: "Posts" },
  { href: "/sobre", label: "Sobre" },
];
const setup = () =>
  render(
    <MobileNav
      items={items}
      label="Abrir menu"
      closeLabel="Fechar menu"
      title="Menu"
    />,
  );

describe("MobileNav", () => {
  it("abre ao clicar no trigger", async () => {
    setup();
    expect(screen.queryByText("Sobre")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(await screen.findByText("Sobre")).toBeInTheDocument();
  });

  it("Escape fecha", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    await screen.findByText("Sobre");
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() => expect(screen.queryByText("Sobre")).toBeNull());
  });

  it("clicar num link fecha o menu", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    const link = await screen.findByText("Sobre");
    // Evita o ruído "Not implemented: navigation" do jsdom.
    document.addEventListener("click", (e) => e.preventDefault(), {
      once: true,
    });
    fireEvent.click(link);
    await waitFor(() => expect(screen.queryByText("Sobre")).toBeNull());
  });

  it("trigger alterna aria-expanded", async () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    await screen.findByText("Sobre");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("nav tem rótulo e alvos de toque ≥ 44px", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    await screen.findByText("Sobre");
    expect(
      screen.getByRole("navigation", { name: "Menu" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sobre").className).toContain("py-3");
    expect(
      screen.getByRole("button", { name: "Fechar menu" }).className,
    ).toContain("size-11");
  });
});
