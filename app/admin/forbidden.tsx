import { Button } from "@/components/ui/button";
import { logout } from "./login/actions";

// Mensagem neutra: não diz qual seção existe nem por que o acesso foi negado.
// Trocar de conta passa pelo logout: o login devolve direto ao /admin quem
// ainda tem sessão de e-mail listado.
export default function AdminForbidden() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Acesso negado</h1>
      <p className="text-muted-foreground">
        Este e-mail não tem permissão para esta área.
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Sair e entrar com outro e-mail
        </Button>
      </form>
    </>
  );
}
