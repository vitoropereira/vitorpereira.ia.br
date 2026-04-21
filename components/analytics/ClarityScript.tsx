"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { readConsent } from "@/lib/consent";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

const subscribeToConsent = () => () => {};
const getConsentSnapshot = () => readConsent() === "accepted";
const getServerConsentSnapshot = () => false;

export function ClarityScript() {
  const allowed = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  if (!CLARITY_ID || !allowed) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/${CLARITY_ID}";
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script");`}
    </Script>
  );
}
