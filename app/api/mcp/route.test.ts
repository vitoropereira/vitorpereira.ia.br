import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

function mcpRequest(method: "GET" | "POST", body?: object) {
  return new Request("https://vitorpereira.ia.br/api/mcp", {
    method,
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("MCP route", () => {
  it("initializes a stateless, read-only MCP server", async () => {
    const response = await POST(
      mcpRequest("POST", {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "route-test", version: "1.0.0" },
        },
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.text();
    const message = payload.match(/^data: (.+)$/m)?.[1];

    expect(JSON.parse(message ?? "{}")).toMatchObject({
      id: 1,
      result: { serverInfo: { name: "cobranca-inteligente" } },
    });
  });

  it("advertises exactly one bounded read-only tool", async () => {
    const response = await POST(
      mcpRequest("POST", {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    );

    const payload = await response.text();
    const message = payload.match(/^data: (.+)$/m)?.[1];
    const result = JSON.parse(message ?? "{}");

    expect(result).toMatchObject({
      id: 2,
      result: {
        tools: [
          {
            name: "collections.analyze_portfolio",
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              openWorldHint: false,
            },
          },
        ],
      },
    });
  });

  it("rejects a browser request from an unapproved origin", async () => {
    const request = mcpRequest("POST", {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/list",
      params: {},
    });
    request.headers.set("Origin", "https://evil.example");

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "Forbidden origin" },
    });
  });

  it("rejects a request whose declared body exceeds 1 MiB", async () => {
    const request = mcpRequest("POST", {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/list",
      params: {},
    });
    request.headers.set("Content-Length", "1048577");

    const response = await POST(request);

    expect(response.status).toBe(413);
  });

  it("rejects a streamed body over 1 MiB without a Content-Length header", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(1_048_577)));
        controller.close();
      },
    });
    const request = new Request("https://vitorpereira.ia.br/api/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body,
      duplex: "half",
    } as RequestInit);

    const response = await POST(request);

    expect(response.status).toBe(413);
  });

  it("rejects an invalid calendar date instead of normalizing it", async () => {
    const response = await POST(
      mcpRequest("POST", {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "collections.analyze_portfolio",
          arguments: {
            asOf: "2026-02-31",
            invoices: [
              {
                id: "demo-1",
                customerId: "acme",
                customerName: "ACME Serviços",
                dueDate: "2026-02-28",
                amountCents: 10000,
                status: "open",
                doNotContact: false,
              },
            ],
          },
        },
      }),
    );
    const payload = await response.text();
    const message = payload.match(/^data: (.+)$/m)?.[1];

    expect(JSON.parse(message ?? "{}")).toMatchObject({ result: { isError: true } });
  });

  it("rejects invoice amounts that could overflow aggregated cents", async () => {
    const response = await POST(
      mcpRequest("POST", {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "collections.analyze_portfolio",
          arguments: {
            asOf: "2026-10-01",
            invoices: [
              {
                id: "demo-1",
                customerId: "acme",
                customerName: "ACME Serviços",
                dueDate: "2026-09-01",
                amountCents: 18_014_398_509_482,
                status: "open",
                doNotContact: false,
              },
            ],
          },
        },
      }),
    );
    const payload = await response.text();
    const message = payload.match(/^data: (.+)$/m)?.[1];

    expect(JSON.parse(message ?? "{}")).toMatchObject({ result: { isError: true } });
  });

  it("does not expose a GET endpoint for portfolio data", async () => {
    const response = await GET();

    expect(response.status).toBe(405);
  });
});
