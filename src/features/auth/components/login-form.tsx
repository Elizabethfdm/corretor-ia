"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { idleActionState } from "@/features/auth/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      messageRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage status="error" message={state.message} />
        </div>
      ) : null}

      <FormField id="email" label="E-mail" errors={state.fieldErrors?.["email"]}>
        <Input name="email" type="email" autoComplete="email" required />
      </FormField>

      <FormField id="password" label="Senha" errors={state.fieldErrors?.["password"]}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </FormField>

      <div className="text-right text-sm">
        <Link href="/recuperar-senha" className="underline">
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Ainda não tem uma conta?{" "}
        <Link href="/cadastro" className="font-medium underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
