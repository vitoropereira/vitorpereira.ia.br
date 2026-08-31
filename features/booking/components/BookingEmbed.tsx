"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

type Props = {
  /** Slug completo no Cal.com, ex.: "vitorpereira/diagnostico-30min". */
  calLink: string;
  /** Namespace do embed — precisa ser único por página. */
  namespace: string;
};

export function BookingEmbed({ calLink, namespace }: Props) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, [namespace]);

  return (
    <Cal
      namespace={namespace}
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{
        layout: "month_view",
        // "auto" deixa o iframe seguir o prefers-color-scheme do visitante.
        // Passar o tema resolvido do next-themes não funcionaria: o embed-react
        // guarda a init num ref e ignora mudanças de `config` depois do primeiro
        // render, então o iframe ficava travado no tema do mount enquanto o
        // resto do site trocava no ThemeToggle.
        theme: "auto",
      }}
    />
  );
}
