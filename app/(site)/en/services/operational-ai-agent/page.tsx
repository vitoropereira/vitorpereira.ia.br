import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/components/seo/buildMetadata";
import { OperationalAgentService } from "@/features/marketing/components/OperationalAgentService";
import { siteConfig } from "@/lib/siteConfig";

const path = "/en/services/operational-ai-agent";
const title = "Operational AI Agent";
const description =
  "Deployment of an AI agent for one real workflow, integrated with the company's tools and controlled through logs, boundaries, and human approval.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  path,
  locale: "en",
  alternatePath: "/servicos/agente-operacional",
  type: "website",
});

export default function OperationalAgentPageEn() {
  return (
    <>
      <JsonLd
        data={{
          type: "Service",
          locale: "en",
          name: title,
          description,
          url: `${siteConfig.url}${path}`,
        }}
      />
      <OperationalAgentService locale="en" />
    </>
  );
}
