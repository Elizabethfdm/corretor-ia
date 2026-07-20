"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/features/auth/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") {
      messageRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success" && state.message) {
    return (
      <div ref={messageRef} tabIndex={-1}>
        <FormMessage status="success" message={state.message} />
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            Ir para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage status="error" message={state.message} />
        </div>
      ) : null}

      <input type="hidden" name="token" value={token} />

      <FormField
        id="newPassword"
        label="Nova senha"
        hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
        errors={state.fieldErrors?.["newPassword"]}
      >
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </FormField>

      <FormField
        id="confirmNewPassword"
        label="Confirmar nova senha"
        errors={state.fieldErrors?.["confirmNewPassword"]}
      >
        <Input
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </FormField>

      <SubmitButton pendingLabel="Salvando...">Redefinir senha</SubmitButton>
    </form>
  );
}
