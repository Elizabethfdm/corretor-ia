"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: string;
}

/**
 * Botão de envio com estado de carregamento (RNF-006) e prevenção de
 * duplo envio (RNF-005): fica desabilitado enquanto a Server Action do
 * formulário pai está em andamento (useFormStatus).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 ${className}`}
      {...props}
    >
      {pending ? (pendingLabel ?? "Enviando...") : children}
    </button>
  );
}
