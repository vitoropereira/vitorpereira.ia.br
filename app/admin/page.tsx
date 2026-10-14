import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { ADMIN_SECTIONS } from "@/lib/admin/sections";
import { logout } from "./login/actions";

export default async function AdminIndexPage() {
  const { email, sections } = await requireAdmin();
  const visible = ADMIN_SECTIONS.filter((s) => sections.includes(s.slug));

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </header>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhuma seção disponível para este e-mail.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((s) => (
            <li key={s.slug}>
              <Link href={s.href} className="underline underline-offset-4">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
