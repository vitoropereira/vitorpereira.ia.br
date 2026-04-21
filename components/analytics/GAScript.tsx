import Script from "next/script";
import { readConsentFromRequest } from "@/lib/consent-server";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export async function GAScript() {
  if (!GA_ID) return null;
  const consent = await readConsentFromRequest();
  if (consent !== "accepted") return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
