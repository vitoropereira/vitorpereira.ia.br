import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

  it("o HTML inicial já traz o cenário 1 completo e o rótulo de exemplo (sem JS)", () => {
    render(<AgentLog locale="pt" />);
    for (const l of pt[0]!.lines)
      expect(screen.getAllByText(l.text).length).toBeGreaterThan(0);
    expect(screen.getByText(/exemplo de execução/i)).toBeInTheDocument();
  });

  it("passa ao próximo cenário e digita linha a linha quando visível", () => {
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(2600)); // pausa no cenário 1
    expect(screen.queryByText(pt[0]!.lines[0]!.text)).toBeNull();
    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByText(pt[1]!.lines[0]!.text)).toBeInTheDocument();
    expect(screen.queryByText(pt[1]!.lines[3]!.text)).toBeNull();
  });

  it("pausa fora da tela", () => {
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(false));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getAllByText(pt[0]!.lines[0]!.text).length).toBeGreaterThan(
      0,
    );
  });

  it("com reduced-motion fica estático no cenário 1", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getAllByText(pt[0]!.lines[4]!.text).length).toBeGreaterThan(
      0,
    );
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
    expect(
      screen.getAllByText(agentLogScenarios.en[0]!.lines[0]!.text).length,
    ).toBeGreaterThan(0);
  });
});
