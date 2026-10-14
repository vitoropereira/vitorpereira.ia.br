import Link from "next/link";

// Mensagem neutra: não diz qual seção existe nem por que o acesso foi negado.
export default function AdminForbidden() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Acesso negado</h1>
      <p className="text-muted-foreground">
        Este e-mail não tem permissão para esta área.
      </p>
      <Link href="/admin/login" className="underline underline-offset-4">
        Entrar com outro e-mail
      </Link>
    </>
  );
}
