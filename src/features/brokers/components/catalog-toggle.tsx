"use client";

import { useActionState } from "react";
import { toggleCatalogAction } from "@/features/brokers/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

interface CatalogToggleProps {
  enabled: boolean;
}

export function CatalogToggle({ enabled }: CatalogToggleProps) {
  const [state, formAction] = useActionState(toggleCatalogAction, idleActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="enabled" value={(!enabled).toString()} />
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Catálogo está{" "}
          <strong className={enabled ? "text-green-700 dark:text-green-400" : "text-zinc-500"}>
            {enabled ? "publicado" : "despublicado"}
          </strong>
        </span>
        <SubmitButton pendingLabel="Aguarde..." className="w-auto px-4 py-2 text-sm">
          {enabled ? "Despublicar catálogo" : "Publicar catálogo"}
        </SubmitButton>
      </div>
      {state.status !== "idle" && state.message ? (
        <FormMessage
          status={state.status === "error" ? "error" : "success"}
          message={state.message}
        />
      ) : null}
    </form>
  );
}
