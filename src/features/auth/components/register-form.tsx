"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { registerAction } from "@/features/auth/actions";
import { idleActionState } from "@/features/auth/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleActionState);
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

      <FormField id="fullName" label="Nome completo" errors={state.fieldErrors?.["fullName"]}>
        <Input name="fullName" type="text" autoComplete="name" required maxLength={150} />
      </FormField>

      <FormField id="email" label="E-mail" errors={state.fieldErrors?.["email"]}>
        <Input name="email" type="email" autoComplete="email" required />
      </FormField>

      <FormField
        id="password"
        label="Senha"
        hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
        errors={state.fieldErrors?.["password"]}
      >
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </FormField>

      <FormField
        id="confirmPassword"
        label="Confirmar senha"
        errors={state.fieldErrors?.["confirmPassword"]}
      >
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </FormField>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            className="mt-1 h-4 w-4 shrink-0"
            aria-describedby={
              state.fieldErrors?.["termsAccepted"] ? "termsAccepted-error" : undefined
            }
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos-de-uso" className="underline">
              Termos de Uso
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.["termsAccepted"] ? (
          <p id="termsAccepted-error" role="alert" className="text-sm text-red-600">
            {state.fieldErrors["termsAccepted"].join(" ")}
          </p>
        ) : null}

        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="privacyAccepted"
            required
            className="mt-1 h-4 w-4 shrink-0"
            aria-describedby={
              state.fieldErrors?.["privacyAccepted"] ? "privacyAccepted-error" : undefined
            }
          />
          <span>
            Li e aceito a{" "}
            <Link href="/politica-de-privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.["privacyAccepted"] ? (
          <p id="privacyAccepted-error" role="alert" className="text-sm text-red-600">
            {state.fieldErrors["privacyAccepted"].join(" ")}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Criando conta...">Criar conta</SubmitButton>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
