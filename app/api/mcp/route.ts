import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { analyzePortfolio } from "@/lib/collections/portfolio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const invoiceSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountCents: z.number().int().positive(),
  status: z.enum(["open", "paid", "void"]),
  doNotContact: z.boolean(),
});

const analysisSchema = z.object({
  totalOpenCents: z.number().int().nonnegative(),
  accounts: z.array(
    z.object({
      customerId: z.string(),
      customerName: z.string(),
      amountCents: z.number().int().positive(),
      oldestDueDate: z.string(),
      daysOverdue: z.number().int().nonnegative(),
      priority: z.enum(["high", "medium"]),
      recommendedAction: z.enum(["human_review", "prepare_reminder"]),
      reason: z.string(),
    }),
  ),
});

function createMcpServer(): McpServer {
  const server = new McpServer({ name: "cobranca-inteligente", version: "0.1.0" });

  server.registerTool(
    "collections.analyze_portfolio",
    {
      title: "Analisar carteira de cobrança",
      description:
        "Use when a finance operator explicitly provides a small invoice portfolio and wants a read-only, explainable collection priority queue. It only analyzes the supplied invoices; it never sends messages, accesses a CRM, changes records, or makes payment decisions.",
      inputSchema: {
        asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        invoices: z.array(invoiceSchema).min(1).max(500),
      },
      outputSchema: analysisSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => {
      const analysis = analyzePortfolio(input);

      return {
        content: [
          {
            type: "text",
            text: `Carteira analisada: ${analysis.accounts.length} conta(s) prioritária(s), sem ações externas.`,
          },
        ],
        structuredContent: { ...analysis },
      };
    },
  );

  return server;
}

/** MCP stateless: o processo recebe somente o payload desta request e não o persiste. */
export async function POST(request: Request): Promise<Response> {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  await server.connect(transport);
  return transport.handleRequest(request);
}

export function GET(): Response {
  return Response.json(
    { error: "Method not allowed. Use Streamable HTTP POST at this endpoint." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
