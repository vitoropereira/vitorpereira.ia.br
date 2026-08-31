"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useTheme } from "next-themes";

type Props = {
  /** Slug completo no Cal.com, ex.: "vitorpereira/diagnostico-30min". */
  calLink: string;
  /** Namespace do embed — precisa ser único por página. */
  namespace: string;
};

export function BookingEmbed({ calLink, namespace }: Props) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [namespace]);

  return (
    <Cal
      namespace={namespace}
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{
        layout: "month_view",
        theme: resolvedTheme === "light" ? "light" : "dark",
      }}
    />
  );
}
