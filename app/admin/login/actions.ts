"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { isListed, normalizeEmail } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; message?: string; error?: string };

const emailSchema = z.email();
const tokenSchema = z.string().regex(/^\d{6}$/);

// Mesma resposta para quem está e quem não está na lista: o formulário não
// pode servir de oráculo para descobrir quais e-mails têm acesso.
const NEUTRAL_MESSAGE =
  "Se este e-mail tiver acesso, um código de 6 dígitos chegou na caixa de entrada.";
const INVALID_CODE = "Código inválido ou expirado.";

export async function requestCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(
    normalizeEmail(String(formData.get("email") ?? "")),
  );
  if (!parsed.success) return { step: "email", error: "E-mail inválido." };
  const email = parsed.data;

  // Fora da lista não chega ao Supabase. Para quem está na lista, o envio roda
  // depois da resposta (after): se esperasse o Auth, o tempo de resposta
  // denunciaria quem tem acesso. shouldCreateUser: false impede que o login
  // vire cadastro aberto.
  if (isListed(email, process.env.ADMIN_ACCESS)) {
    const supabase = await createClient().catch(() => null);
    after(async () => {
      try {
        await supabase?.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
      } catch {
        // Erro do Auth também fica neutro; a mensagem real não sai daqui.
      }
    });
  }

  return { step: "code", email, message: NEUTRAL_MESSAGE };
}

export async function verifyCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = normalizeEmail(String(formData.get("email") ?? ""));
  const email = emailSchema.safeParse(rawEmail);
  const token = tokenSchema.safeParse(String(formData.get("token") ?? ""));
  const fail: LoginState = {
    step: "code",
    email: rawEmail,
    error: INVALID_CODE,
  };

  if (!email.success || !token.success) return fail;
  if (!isListed(email.data, process.env.ADMIN_ACCESS)) return fail;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.data,
      token: token.data,
      type: "email",
    });
    if (error) return fail;
  } catch {
    return fail;
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
