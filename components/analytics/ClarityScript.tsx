import { readConsentFromRequest } from "@/lib/consent-server";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export async function ClarityScript() {
  if (!CLARITY_ID) return null;
  const consent = await readConsentFromRequest();
  if (consent !== "accepted") return null;

  return <script async src={`https://www.clarity.ms/tag/${CLARITY_ID}`} />;
}
