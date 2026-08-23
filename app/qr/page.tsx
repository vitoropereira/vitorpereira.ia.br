import type { Metadata } from "next";
import Image from "next/image";
import { buildMetadata } from "@/components/seo/buildMetadata";

export const metadata: Metadata = buildMetadata({
  title: "QR do cartão",
  description: "QR Code que aponta para o cartão de visita digital.",
  path: "/qr",
  locale: "pt",
  noIndex: true,
});

/**
 * Tela para MOSTRAR o QR — é o Vitor que abre esta página e vira o celular
 * para a outra pessoa escanear.
 *
 * O QR fica sobre um cartão branco mesmo com a página escura: câmera de celular
 * barato erra muito em QR invertido, e aqui não dá pra pedir segunda tentativa.
 * O arquivo é o mesmo `qr-card.svg` que vai pra impressão — um QR só, uma
 * verdade só.
 */
export default function QrPage() {
  return (
    <div
      className="dark bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12"
      style={{ colorScheme: "dark" }}
    >
      <div className="rounded-3xl bg-white p-5 shadow-2xl">
        <Image
          src="/card/qr-card.svg"
          alt="QR Code para vitorpereira.ia.br/card"
          width={280}
          height={280}
          priority
          unoptimized
          className="h-64 w-64 sm:h-72 sm:w-72"
        />
      </div>

      <div className="text-center">
        <p className="font-mono text-sm tracking-tight lowercase">
          <span className="text-foreground">vitor</span>
          <span className="text-muted-foreground pl-[0.3ch]">pereira</span>
          <span aria-hidden className="brand-cursor" />
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Aponte a câmera para salvar meu contato
        </p>
      </div>
    </div>
  );
}
