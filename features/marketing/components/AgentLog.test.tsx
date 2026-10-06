import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { AgentLog } from "./AgentLog";
import { agentLogScenarios } from "../data/agentLogScenarios";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";

const pt = agentLogScenarios.pt;

describe("AgentLog", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;
  beforeEach(() => {
    vi.useFakeTimers();
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });
  afterEach(() => {
    io.restore();
    restoreMM();
    vi.useRealTimers();
  });

  // A lista animada é aria-hidden; a sr-only repete o cenário 1 e não conta.
  const animated = (c: HTMLElement) =>
    within(c.querySelector('ol[aria-hidden="true"]') as HTMLElement);
  const WAIT = 2600 + 700;

  it("o HTML inicial já traz o cenário 1 completo e o rótulo de exemplo (sem JS)", () => {
    const { container } = render(<AgentLog locale="pt" />);
    for (const l of pt[0]!.lines)
      expect(animated(container).getByText(l.text)).toBeInTheDocument();
    expect(screen.getByText(/exemplo de execução/i)).toBeInTheDocument();
    expect(screen.getByText("simulação")).toBeInTheDocument();
  });

  it("leitor de tela lê o cenário 1 numa lista estática sr-only", () => {
    const { container } = render(<AgentLog locale="pt" />);
    const sr = container.querySelector("ol.sr-only") as HTMLElement;
    expect(sr.querySelectorAll("li")).toHaveLength(pt[0]!.lines.length);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(WAIT));
    expect(sr.querySelectorAll("li")).toHaveLength(pt[0]!.lines.length);
  });

  it("passa ao próximo cenário e digita linha a linha quando visível", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(2600)); // pausa no cenário 1
    expect(animated(container).queryByText(pt[0]!.lines[0]!.text)).toBeNull();
    act(() => vi.advanceTimersByTime(700));
    expect(
      animated(container).getByText(pt[1]!.lines[0]!.text),
    ).toBeInTheDocument();
    expect(animated(container).queryByText(pt[1]!.lines[3]!.text)).toBeNull();
  });

  it("duplo trigger não gera passo duplicado", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(WAIT));
    expect(
      animated(container).getByText(pt[1]!.lines[0]!.text),
    ).toBeInTheDocument();
    expect(animated(container).queryByText(pt[1]!.lines[1]!.text)).toBeNull();
  });

  it("pausa fora da tela", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(false));
    act(() => vi.advanceTimersByTime(10000));
    expect(
      animated(container).getByText(pt[0]!.lines[0]!.text),
    ).toBeInTheDocument();
  });

  it("retoma depois de pausar no meio da pausa", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(1000));
    act(() => io.trigger(false));
    act(() => vi.advanceTimersByTime(10000));
    expect(
      animated(container).getByText(pt[0]!.lines[0]!.text),
    ).toBeInTheDocument();
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(WAIT));
    expect(
      animated(container).getByText(pt[1]!.lines[0]!.text),
    ).toBeInTheDocument();
  });

  it("pausa com a aba oculta e retoma ao voltar", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    const setHidden = (v: boolean) =>
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => v,
      });
    try {
      setHidden(true);
      act(() => void document.dispatchEvent(new Event("visibilitychange")));
      act(() => vi.advanceTimersByTime(10000));
      expect(
        animated(container).getByText(pt[0]!.lines[0]!.text),
      ).toBeInTheDocument();
      setHidden(false);
      act(() => void document.dispatchEvent(new Event("visibilitychange")));
      act(() => vi.advanceTimersByTime(WAIT));
      expect(
        animated(container).getByText(pt[1]!.lines[0]!.text),
      ).toBeInTheDocument();
    } finally {
      // @ts-expect-error -- remove o override para voltar ao getter do jsdom
      delete document.hidden;
    }
  });

  it("volta ao cenário 1 depois do último", () => {
    const { container } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    // 2500 hold + 600 + 3*600 (cen. 2) + 2500 + 600 + 4*600 (cen. 3) + 2500 + 600 + 600
    act(() =>
      vi.advanceTimersByTime(
        2500 + 600 + 4 * 600 + 2500 + 600 + 5 * 600 + 2500 + 600 + 600,
      ),
    );
    expect(
      animated(container).getByText(pt[0]!.lines[0]!.text),
    ).toBeInTheDocument();
    expect(animated(container).queryByText(pt[0]!.lines[4]!.text)).toBeNull();
  });

  it("com reduced-motion fica estático no cenário 1, sem observer nem timer", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    const { container } = render(<AgentLog locale="pt" />);
    act(() => vi.advanceTimersByTime(20000));
    expect(io.instances.length).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(
      animated(container).getByText(pt[0]!.lines[4]!.text),
    ).toBeInTheDocument();
  });

  it("desmontar no meio da animação limpa os timers", () => {
    const { unmount } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(3000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("EN usa os cenários em inglês", () => {
    render(<AgentLog locale="en" />);
    expect(screen.getByText(/example run/i)).toBeInTheDocument();
    expect(screen.getByText("simulated")).toBeInTheDocument();
    expect(
      screen.getAllByText(agentLogScenarios.en[0]!.lines[0]!.text).length,
    ).toBeGreaterThan(0);
  });
});
