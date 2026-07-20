"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { idleActionState } from "@/features/auth/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RequestPasswordResetForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, idleActionState);
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
            Voltar para o login
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

      <FormField id="email" label="E-mail" errors={state.fieldErrors?.["email"]}>
        <Input name="email" type="email" autoComplete="email" required />
      </FormField>

      <SubmitButton pendingLabel="Enviando...">Enviar link de redefinição</SubmitButton>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
