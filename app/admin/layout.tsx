import type { Metadata } from "next";

// Área privada: sem Header/Footer do site, sem i18n e sem analytics. Nada de
// components/layout ou components/analytics aqui (o analytics-scope.test.ts
// confere).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Página com gráfico marca `data-largura="ampla"` e ganha mais largura; as
  // telas de formulário seguem estreitas.
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-6 py-16 has-[[data-largura=ampla]]:max-w-5xl">
      {children}
    </main>
  );
}
