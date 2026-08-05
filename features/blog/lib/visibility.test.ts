import { describe, expect, it } from "vitest";
import { hiddenReason, isPublic, isScheduled } from "./visibility";

const NOW = new Date("2026-08-05T12:00:00Z");

describe("isScheduled", () => {
  it("é true para data futura", () => {
    expect(isScheduled({ date: "2026-08-06T10:00:00-03:00" }, NOW)).toBe(true);
  });

  it("é false para data passada", () => {
    expect(isScheduled({ date: "2026-08-04T10:00:00-03:00" }, NOW)).toBe(false);
  });

  it("respeita hora e fuso, não só o dia", () => {
    // 2026-08-05T10:00-03:00 === 13:00Z — ainda uma hora no futuro às 12:00Z
    expect(isScheduled({ date: "2026-08-05T10:00:00-03:00" }, NOW)).toBe(true);
    // 2026-08-05T08:00-03:00 === 11:00Z — já passou
    expect(isScheduled({ date: "2026-08-05T08:00:00-03:00" }, NOW)).toBe(false);
  });

  it("trata data ausente ou inválida como não-agendada", () => {
    expect(isScheduled({ date: undefined as unknown as string }, NOW)).toBe(false);
    expect(isScheduled({ date: "não é data" }, NOW)).toBe(false);
  });
});

describe("isPublic", () => {
  it("exige não-draft E data vencida", () => {
    const past = "2026-08-01T10:00:00-03:00";
    const future = "2026-08-20T10:00:00-03:00";
    expect(isPublic({ draft: false, date: past }, NOW)).toBe(true);
    expect(isPublic({ draft: true, date: past }, NOW)).toBe(false);
    expect(isPublic({ draft: false, date: future }, NOW)).toBe(false);
    expect(isPublic({ draft: true, date: future }, NOW)).toBe(false);
  });

  it("draft continua invisível mesmo com data muito antiga", () => {
    expect(isPublic({ draft: true, date: "2020-01-01" }, NOW)).toBe(false);
  });
});

describe("hiddenReason", () => {
  it("distingue draft de agendado", () => {
    expect(hiddenReason({ draft: true, date: "2020-01-01" }, NOW)).toBe("draft");
    expect(hiddenReason({ draft: false, date: "2026-12-01" }, NOW)).toBe("scheduled");
    expect(hiddenReason({ draft: false, date: "2020-01-01" }, NOW)).toBeNull();
  });

  it("draft tem precedência sobre agendado", () => {
    expect(hiddenReason({ draft: true, date: "2026-12-01" }, NOW)).toBe("draft");
  });
});
