import { describe, expect, it } from "vitest";
import {
  formatarHoraEvento,
  formatarTempoMedio,
  formatarUltimoDeploy,
} from "./formato";

describe("formatarTempoMedio", () => {
  it("null vira 'sem dado'", () => {
    expect(formatarTempoMedio(null)).toBe("sem dado");
  });
  it("formata dias e horas", () => {
    expect(formatarTempoMedio(28)).toBe("1 dia e 4 h");
    expect(formatarTempoMedio(48)).toBe("2 dias");
    expect(formatarTempoMedio(5)).toBe("5 h");
    expect(formatarTempoMedio(0.5)).toBe("30 min");
  });
});

describe("formatarUltimoDeploy", () => {
  const agora = new Date("2026-11-12T18:00:00Z");
  it("hoje com hora, ontem, data e sem dado", () => {
    expect(formatarUltimoDeploy("2026-11-12T14:22:00Z", agora)).toBe(
      "hoje 11:22",
    );
    expect(formatarUltimoDeploy("2026-11-11T14:22:00Z", agora)).toBe("ontem");
    expect(formatarUltimoDeploy("2026-11-05T14:22:00Z", agora)).toBe("05/11");
    expect(formatarUltimoDeploy(null, agora)).toBe("—");
    expect(formatarUltimoDeploy("lixo", agora)).toBe("—");
  });
});

describe("formatarHoraEvento", () => {
  const agora = new Date("2026-11-12T18:00:00Z");
  it("hora de hoje, data e hora de outro dia, e ilegível", () => {
    expect(formatarHoraEvento("2026-11-12T14:22:00Z", agora)).toBe("11:22");
    expect(formatarHoraEvento("2026-11-11T05:01:38Z", agora)).toBe(
      "11/11 02:01",
    );
    expect(formatarHoraEvento("", agora)).toBe("—");
    expect(formatarHoraEvento("lixo", agora)).toBe("—");
  });
});
