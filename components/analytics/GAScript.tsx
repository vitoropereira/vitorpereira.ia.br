"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { readConsent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const subscribeToConsent = () => () => {};
const getConsentSnapshot = () => readConsent() === "accepted";
const getServerConsentSnapshot = () => false;

export function GAScript() {
  const allowed = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
