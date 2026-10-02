import { describe, expect, it } from "vitest";
import { analyzePortfolio } from "./portfolio";

describe("analyzePortfolio", () => {
  it("prioritizes overdue balances while excluding paid and do-not-contact invoices", () => {
    const result = analyzePortfolio({
      asOf: "2026-10-01",
      invoices: [
        {
          id: "open-high",
          customerId: "acme",
          customerName: "ACME Serviços",
          dueDate: "2026-09-01",
          amountCents: 250000,
          status: "open",
          doNotContact: false,
        },
        {
          id: "paid",
          customerId: "paid",
          customerName: "Já Pago",
          dueDate: "2026-09-01",
          amountCents: 900000,
          status: "paid",
          doNotContact: false,
        },
        {
          id: "blocked",
          customerId: "blocked",
          customerName: "Em disputa",
          dueDate: "2026-08-01",
          amountCents: 500000,
          status: "open",
          doNotContact: true,
        },
      ],
    });

    expect(result).toMatchObject({
      totalOpenCents: 250000,
      accounts: [
        {
          customerId: "acme",
          priority: "high",
          recommendedAction: "human_review",
        },
      ],
    });
  });
});
