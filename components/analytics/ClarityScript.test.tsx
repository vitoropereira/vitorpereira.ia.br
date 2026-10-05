import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/consent-server", () => ({
  readConsentFromRequest: vi.fn(),
}));

import { readConsentFromRequest } from "@/lib/consent-server";

const mockedConsent = vi.mocked(readConsentFromRequest);

async function render(id = "abc123") {
  vi.stubEnv("NEXT_PUBLIC_CLARITY_ID", id);
  vi.resetModules();
  const { ClarityScript } = await import("./ClarityScript");
  const el = await ClarityScript();
  return el ? renderToStaticMarkup(el) : "";
}

describe("ClarityScript", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("não carrega nada sem consentimento aceito", async () => {
    mockedConsent.mockResolvedValue("rejected");
    expect(await render()).toBe("");
  });

  it("define a fila window.clarity antes de carregar a tag", async () => {
    mockedConsent.mockResolvedValue("accepted");
    const html = await render();

    // Sem a fila, a tag do Clarity quebra ao ler window.clarity.v e não grava sessão.
    expect(html).toContain("(c[a].q=c[a].q||[]).push(arguments)");
    expect(html).toContain("https://www.clarity.ms/tag/");
    expect(html).toContain('"abc123"');
  });

  it("recusa ID fora do formato, que poderia fechar o <script>", async () => {
    mockedConsent.mockResolvedValue("accepted");
    expect(await render('x"</script><script>alert(1)//')).toBe("");
  });
});
