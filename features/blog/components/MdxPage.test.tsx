import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// next-mdx-remote/rsc é async server component; aqui só interessa o contêiner.
vi.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));

vi.mock("../mdx/MDXComponents", () => ({ mdxComponents: {} }));

import { MdxPage } from "./MdxPage";

describe("MdxPage", () => {
  it("com variant=about o contêiner tem prose-post e prose-about", () => {
    const { container } = render(
      <MdxPage title="Sobre" body="x" variant="about" />,
    );
    const article = container.querySelector("article")!;
    expect(article.className).toContain("prose-post");
    expect(article.className).toContain("prose-about");
  });

  it("sem variant não aplica prose-about", () => {
    const { container } = render(<MdxPage title="Termos" body="x" />);
    expect(container.querySelector("article")!.className).not.toContain(
      "prose-about",
    );
  });
});
