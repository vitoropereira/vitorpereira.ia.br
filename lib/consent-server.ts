import { cookies } from "next/headers";
import type { ConsentValue } from "@/lib/consent";

export async function readConsentFromRequest(): Promise<ConsentValue | null> {
  const store = await cookies();
  const value = store.get("consent")?.value;
  if (value === "accepted" || value === "rejected") return value;
  return null;
}
