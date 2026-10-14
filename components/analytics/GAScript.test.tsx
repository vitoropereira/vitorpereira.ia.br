import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/consent-server", () => ({
  readConsentFromRequest: vi.fn(),
}));

import { readConsentFromRequest } from "@/lib/consent-server";

const mockedConsent = vi.mocked(readConsentFromRequest);

async function render(id = "G-TEST123") {
  vi.stubEnv("NEXT_PUBLIC_GA_ID", id);
  vi.resetModules();
  const { GAScript } = await import("./GAScript");
  const el = await GAScript();
  if (!el) return "";
  // O next/script (afterInteractive) não sai no markup estático: o snippet
  // inline é conferido na própria árvore de elementos.
  return renderToStaticMarkup(el) + JSON.stringify(el.props);
}

describe("GAScript", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("não carrega GA sem resposta de consentimento", async () => {
    mockedConsent.mockResolvedValue(null);
    expect(await render()).not.toContain("googletagmanager");
  });

  it("não carrega GA com consentimento recusado", async () => {
    mockedConsent.mockResolvedValue("rejected");
    expect(await render()).not.toContain("googletagmanager");
  });

  it("não renderiza nada nem lança erro sem a env", async () => {
    mockedConsent.mockResolvedValue("accepted");
    expect(await render("")).toBe("");
  });

  it("carrega a tag com o ID da env quando aceito", async () => {
    mockedConsent.mockResolvedValue("accepted");
    const html = await render("G-TEST123");

    expect(html).toContain("googletagmanager.com/gtag/js?id=G-TEST123");
    expect(html).toContain("gtag('config','G-TEST123'");
  });

  it("recusa ID fora do formato, que poderia fechar o <script>", async () => {
    mockedConsent.mockResolvedValue("accepted");
    expect(await render("G-x'</script>")).toBe("");
  });
});
