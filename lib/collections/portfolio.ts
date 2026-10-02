export type InvoiceStatus = "open" | "paid" | "void";

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  amountCents: number;
  status: InvoiceStatus;
  doNotContact: boolean;
}

export interface AnalyzePortfolioInput {
  asOf: string;
  invoices: Invoice[];
}

export interface PriorityAccount {
  customerId: string;
  customerName: string;
  amountCents: number;
  oldestDueDate: string;
  daysOverdue: number;
  priority: "high" | "medium";
  recommendedAction: "human_review" | "prepare_reminder";
  reason: string;
}

export interface PortfolioAnalysis {
  totalOpenCents: number;
  accounts: PriorityAccount[];
}

function daysBetween(start: string, end: string): number {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  return Math.max(0, Math.floor((endTime - startTime) / 86_400_000));
}

function formatBrl(amountCents: number): string {
  return `R$ ${(amountCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Agrupa somente faturas abertas e libera uma fila explicável, sem efeitos externos. */
export function analyzePortfolio(input: AnalyzePortfolioInput): PortfolioAnalysis {
  const blockedCustomerIds = new Set(
    input.invoices.filter((invoice) => invoice.doNotContact).map((invoice) => invoice.customerId),
  );
  const openInvoices = input.invoices.filter(
    (invoice) => invoice.status === "open" && !blockedCustomerIds.has(invoice.customerId),
  );
  const byCustomer = new Map<string, Invoice[]>();

  for (const invoice of openInvoices) {
    const customerInvoices = byCustomer.get(invoice.customerId) ?? [];
    customerInvoices.push(invoice);
    byCustomer.set(invoice.customerId, customerInvoices);
  }

  const accounts = [...byCustomer.entries()]
    .map(([customerId, invoices]) => {
      const overdueInvoices = invoices.filter((invoice) => invoice.dueDate < input.asOf);
      if (overdueInvoices.length === 0) return undefined;

      const amountCents = invoices.reduce((total, invoice) => total + invoice.amountCents, 0);
      const oldestDueDate = overdueInvoices.reduce(
        (oldest, invoice) => (invoice.dueDate < oldest ? invoice.dueDate : oldest),
        overdueInvoices[0].dueDate,
      );
      const daysOverdue = daysBetween(oldestDueDate, input.asOf);
      const priority = daysOverdue >= 14 || amountCents >= 200_000 ? "high" : "medium";
      const recommendedAction = priority === "high" ? "human_review" : "prepare_reminder";

      return {
        customerId,
        customerName: invoices[0].customerName,
        amountCents,
        oldestDueDate,
        daysOverdue,
        priority,
        recommendedAction,
        reason: `${daysOverdue} days overdue with ${formatBrl(amountCents)} open`,
      } satisfies PriorityAccount;
    })
    .filter((account): account is PriorityAccount => account !== undefined)
    .sort((left, right) => right.daysOverdue - left.daysOverdue || right.amountCents - left.amountCents);

  return {
    totalOpenCents: openInvoices.reduce((total, invoice) => total + invoice.amountCents, 0),
    accounts,
  };
}
