"use client";

import { useId, useState } from "react";
import { checkSlugAvailabilityAction } from "@/features/brokers/actions";
import { slugSchema } from "@/lib/validation/broker-profile";
import { Input } from "@/components/ui/input";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface SlugFieldProps {
  defaultValue?: string;
  errors?: string[];
}

export function SlugField({ defaultValue, errors }: SlugFieldProps) {
  const id = useId();
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [checkedValue, setCheckedValue] = useState<string | null>(null);

  async function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const value = event.target.value.trim().toLowerCase();

    if (!value) {
      setStatus("idle");
      return;
    }

    const parsed = slugSchema.safeParse(value);
    if (!parsed.success) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const available = await checkSlugAvailabilityAction(parsed.data);
    setCheckedValue(parsed.data);
    setStatus(available ? "available" : "taken");
  }

  const hasErrors = !!errors && errors.length > 0;
  const statusId = `${id}-status`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Endereço do catálogo (slug)
      </label>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>/catalogo/</span>
        <Input
          id={id}
          name="slug"
          type="text"
          defaultValue={defaultValue}
          onBlur={handleBlur}
          aria-describedby={statusId}
          aria-invalid={hasErrors || status === "invalid" || status === "taken" || undefined}
          required
          maxLength={60}
        />
      </div>
      <p id={statusId} role="status" aria-live="polite" className="text-sm">
        {status === "checking" && <span className="text-zinc-500">Verificando...</span>}
        {status === "available" && checkedValue && (
          <span className="text-green-700 dark:text-green-400">
            &quot;{checkedValue}&quot; está disponível.
          </span>
        )}
        {status === "taken" && (
          <span className="text-red-600 dark:text-red-400">Este slug já está em uso.</span>
        )}
        {status === "invalid" && (
          <span className="text-red-600 dark:text-red-400">
            Use apenas letras minúsculas, números e hífen.
          </span>
        )}
      </p>
      {hasErrors ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
