import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { OperationalAgentService } from "@/features/marketing/components/OperationalAgentService";
import { siteConfig } from "@/lib/siteConfig";

const path = "/servicos/agente-operacional";
const title = "Agente Operacional de IA";
const description =
  "Implantação de um agente de IA para executar um processo real, integrado às ferramentas da empresa, com logs, limites e aprovação humana.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path,
  locale: "pt",
  alternatePath: "/en/services/operational-ai-agent",
  type: "website",
});

export default function OperationalAgentPage() {
  return (
    <>
      <JsonLd
        data={{
          type: "Service",
          locale: "pt",
          name: title,
          description,
          url: `${siteConfig.url}${path}`,
        }}
      />
      <OperationalAgentService locale="pt" />
    </>
  );
}
