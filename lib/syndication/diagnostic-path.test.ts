import { describe, it, expect } from "vitest";
import { bookingRoutes } from "@/features/booking/routes";
import { DIAGNOSTIC_PATH } from "./config.ts";

describe("DIAGNOSTIC_PATH", () => {
  it.each(["pt", "en"] as const)("%s espelha bookingRoutes.diagnostic", (locale) => {
    expect(DIAGNOSTIC_PATH[locale]).toBe(bookingRoutes.diagnostic(locale));
  });
});
