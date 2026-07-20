"use client";

import { useActionState, useId } from "react";
import type { ActionState } from "@/lib/forms/action-state";
import { idleActionState } from "@/lib/forms/action-state";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

interface ImageUploadFormProps {
  label: string;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  currentUrl: string | null;
}

export function ImageUploadForm({ label, action, currentUrl }: ImageUploadFormProps) {
  const [state, formAction] = useActionState(action, idleActionState);
  const id = useId();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>

      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem já otimizada/hospedada pelo storage próprio, sem necessidade do pipeline de otimização do Next
        <img
          src={currentUrl}
          alt=""
          className="h-24 w-24 rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700">
          Sem imagem
        </div>
      )}

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="text-sm text-zinc-700 dark:text-zinc-300"
      />

      {state.status !== "idle" && state.message ? (
        <FormMessage
          status={state.status === "error" ? "error" : "success"}
          message={state.message}
        />
      ) : null}

      <SubmitButton pendingLabel="Enviando..." className="w-auto px-4 py-2 text-sm">
        Enviar imagem
      </SubmitButton>
    </form>
  );
}
