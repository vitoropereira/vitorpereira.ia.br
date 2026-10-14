import Script from "next/script";
import { readConsentFromRequest } from "@/lib/consent-server";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// O ID vai interpolado num script inline; só o formato G-XXXX passa, para uma
// env malformada nunca fechar a tag nem injetar código.
const GA_ID_FORMAT = /^G-[A-Z0-9]+$/;

export async function GAScript() {
  if (!GA_ID || !GA_ID_FORMAT.test(GA_ID)) return null;
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
