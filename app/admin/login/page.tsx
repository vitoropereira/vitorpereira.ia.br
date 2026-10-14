import { redirect } from "next/navigation";
import { isListed } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

// Única página de /admin sem requireAdmin: é ela que cria a sessão.
export default async function AdminLoginPage() {
  let email: string | undefined;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email;
  } catch {
    // Sem env ou Auth fora do ar: mostra o formulário mesmo assim.
  }
  // redirect fora do try: ele lança, e o catch engoliria.
  if (isListed(email, process.env.ADMIN_ACCESS)) redirect("/admin");

  return (
    <>
      <h1 className="text-2xl font-semibold">Entrar no admin</h1>
      <LoginForm />
    </>
  );
}
