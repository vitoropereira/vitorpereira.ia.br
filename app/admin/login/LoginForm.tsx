"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestCode, verifyCode, type LoginState } from "./actions";

const initial: LoginState = { step: "email" };

// Dois passos com um estado só: o requestCode avança para "code" e o
// verifyCode continua nele até o redirect para /admin.
async function loginAction(prev: LoginState, formData: FormData) {
  return formData.has("token")
    ? verifyCode(prev, formData)
    : requestCode(prev, formData);
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  if (state.step === "email") {
    return (
      <form action={action} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={state.error ? true : undefined}
        />
        {state.error && (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar código"}
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.message && (
        <p className="text-muted-foreground text-sm">{state.message}</p>
      )}
      <input type="hidden" name="email" value={state.email} />
      <label htmlFor="token" className="text-sm font-medium">
        Código de 6 dígitos
      </label>
      <Input
        id="token"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        aria-invalid={state.error ? true : undefined}
      />
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Verificando…" : "Entrar"}
      </Button>
      {/* Recarregar zera o estado do formulário: volta ao passo do e-mail
          para corrigir o endereço ou pedir outro código. */}
      <Button
        type="button"
        variant="link"
        onClick={() => window.location.reload()}
      >
        Usar outro e-mail ou pedir novo código
      </Button>
    </form>
  );
}
