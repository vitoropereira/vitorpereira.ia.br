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
    fireEvent.click(await screen.findByText("Sobre"));
    await waitFor(() => expect(screen.queryByText("Sobre")).toBeNull());
  });
});
