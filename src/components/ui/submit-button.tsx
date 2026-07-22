"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils/cn";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: string;
}

/**
 * Botão de envio com estado de carregamento (RNF-006) e prevenção de
 * duplo envio (RNF-005): fica desabilitado enquanto a Server Action do
 * formulário pai está em andamento (useFormStatus).
 */
export function SubmitButton({ children, pendingLabel, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200",
        className,
      )}
      {...props}
    >
      {pending ? (pendingLabel ?? "Enviando...") : children}
    </button>
  );
}
