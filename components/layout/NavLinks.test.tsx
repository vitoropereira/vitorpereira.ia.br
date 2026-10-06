import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let path = "/posts";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

import { NavLinks } from "./NavLinks";

const items = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/sobre", label: "Sobre" },
];

describe("NavLinks", () => {
  it("marca só o item da rota atual", () => {
    path = "/posts";
    render(<NavLinks items={items} />);
    expect(screen.getByText("Posts")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Sobre")).not.toHaveAttribute("aria-current");
  });

  it("marca em subrota", () => {
    path = "/posts/2026/x";
    render(<NavLinks items={items} />);
    expect(screen.getByText("Posts")).toHaveAttribute("aria-current", "page");
  });

  it("home não fica ativa em /posts", () => {
    path = "/posts";
    render(<NavLinks items={items} />);
    expect(screen.getByText("Home")).not.toHaveAttribute("aria-current");
  });

  it("home fica ativa em /", () => {
    path = "/";
    render(<NavLinks items={items} />);
    expect(screen.getByText("Home")).toHaveAttribute("aria-current", "page");
  });
});
