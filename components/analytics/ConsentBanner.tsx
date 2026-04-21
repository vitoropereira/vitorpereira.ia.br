"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { writeConsent } from "@/lib/consent";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

const copyByLocale = {
  pt: {
    title: "Cookies",
    body: "Usamos cookies pra entender como o site é usado e melhorar sua experiência. Você pode aceitar ou recusar.",
    accept: "Aceitar",
    reject: "Recusar",
    privacy: "Política de privacidade",
  },
  en: {
    title: "Cookies",
    body: "We use cookies to understand how the site is used and to improve your experience. You can accept or reject.",
    accept: "Accept",
    reject: "Reject",
    privacy: "Privacy policy",
  },
} as const;

type Props = { initiallyVisible: boolean; locale: "pt" | "en" };

export function ConsentBanner({ initiallyVisible, locale }: Props) {
  const [visible, setVisible] = useState(initiallyVisible);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("consent:reopen", handler);
    return () => window.removeEventListener("consent:reopen", handler);
  }, []);

  if (!visible) return null;

  const accept = () => {
    writeConsent("accepted");
    setVisible(false);
    window.location.reload();
  };

  const reject = () => {
    writeConsent("rejected");
    setVisible(false);
  };

  const copy = copyByLocale[locale];

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={copy.title}
      className="bg-background fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground text-sm">
          {copy.body}{" "}
          <Link
            href={institutionalRoutes.privacy[locale]}
            className="hover:text-foreground underline"
          >
            {copy.privacy}
          </Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            {copy.reject}
          </Button>
          <Button size="sm" onClick={accept}>
            {copy.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
