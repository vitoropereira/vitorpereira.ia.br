import { describe, expect, it } from "vitest";

// O plugin do next-intl embrulha a config; aqui só interessa o redirects().
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("admin.vitorpereira.ia.br/ vai para /admin/fabrica (307)", async () => {
    const cfg = await (
      nextConfig as unknown as {
        redirects: () => Promise<Record<string, unknown>[]>;
      }
    ).redirects();
    expect(cfg).toContainEqual({
      source: "/",
      has: [{ type: "host", value: "admin.vitorpereira.ia.br" }],
      destination: "/admin/fabrica",
      permanent: false,
    });
  });
});
