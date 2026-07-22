import { cloneElement, isValidElement, type ReactElement } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  errors?: string[];
  hint?: string;
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Associa label, campo e mensagens de erro via id/aria-describedby
 * (RNF-012, RNF-013): injeta automaticamente id/aria-describedby/
 * aria-invalid no elemento de campo filho, para o chamador não precisar
 * duplicar essa lógica em cada formulário.
 */
export function FormField({ id, label, errors, hint, children }: FormFieldProps) {
  const hasErrors = !!errors && errors.length > 0;
  const describedBy =
    [hasErrors ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") ||
    undefined;

  const field = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": hasErrors || undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
      </label>
      {field}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      ) : null}
      {hasErrors ? (
        <p id={`${id}-error`} role="alert" className="text-danger-600 dark:text-danger-400 text-sm">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
