import { render, screen, within } from "@testing-library/react";
import { MethodTimeline } from "./MethodTimeline";

describe("MethodTimeline", () => {
  it("mostra as 4 etapas em português", () => {
    render(<MethodTimeline locale="pt" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(
      items.map((li) => within(li).getByRole("heading").textContent),
    ).toEqual(["Mapear", "Avaliar", "Implantar", "Operar"]);
  });

  it("mostra as 4 etapas em inglês", () => {
    render(<MethodTimeline locale="en" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(
      items.map((li) => within(li).getByRole("heading").textContent),
    ).toEqual(["Map", "Evaluate", "Deploy", "Operate"]);
  });
});
