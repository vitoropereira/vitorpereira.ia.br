import { fireEvent, render, screen } from "@testing-library/react";
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

  it("sublinhado ativo usa --primary (contraste) e font-medium", () => {
    path = "/posts";
    render(<NavLinks items={items} />);
    const cls = screen.getByText("Posts").className;
    expect(cls).toContain("after:bg-primary");
    expect(cls).toContain("font-medium");
  });

  it("item com matchPatterns fica ativo em post e em tag (PT e EN)", () => {
    const blog = [
      {
        href: "/posts",
        label: "Blog",
        matchPatterns: [/^\/(en\/)?\d{4}\/\d{2}\/\d{2}\//, /^\/(en\/)?tags\//],
      },
    ];
    for (const p of [
      "/2026/04/21/meu-post",
      "/en/2026/04/21/my-post",
      "/tags/ia",
      "/en/tags/ai",
    ]) {
      path = p;
      const { unmount } = render(<NavLinks items={blog} />);
      expect(screen.getByText("Blog")).toHaveAttribute("aria-current", "page");
      unmount();
    }
    path = "/sobre";
    render(<NavLinks items={blog} />);
    expect(screen.getByText("Blog")).not.toHaveAttribute("aria-current");
  });

  it("matchPrefixes também acende o item", () => {
    path = "/arquivo/2020";
    render(
      <NavLinks
        items={[{ href: "/posts", label: "Blog", matchPrefixes: ["/arquivo"] }]}
      />,
    );
    expect(screen.getByText("Blog")).toHaveAttribute("aria-current", "page");
  });

  it("/en (home) não fica ativa em /en/posts", () => {
    path = "/en/posts";
    render(
      <NavLinks
        items={[
          { href: "/en", label: "Home" },
          { href: "/en/posts", label: "Blog" },
        ]}
      />,
    );
    expect(screen.getByText("Home")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Blog")).toHaveAttribute("aria-current", "page");
  });

  it("chama onNavigate ao clicar num link", () => {
    path = "/";
    const onNavigate = vi.fn();
    render(<NavLinks items={items} onNavigate={onNavigate} />);
    // Evita o ruído "Not implemented: navigation" do jsdom.
    document.addEventListener("click", (e) => e.preventDefault(), {
      once: true,
    });
    fireEvent.click(screen.getByText("Sobre"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
