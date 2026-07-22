import { cn } from "@/lib/utils/cn";

interface FormMessageProps {
  status: "error" | "success";
  message: string;
}

/**
 * Mensagem de resultado do formulário (sucesso/erro) anunciada a
 * leitores de tela via aria-live (RNF-015).
 */
export function FormMessage({ status, message }: FormMessageProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        status === "error"
          ? "border-danger-300 bg-danger-50 text-danger-800 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-200"
          : "border-success-300 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-950 dark:text-success-200",
      )}
    >
      {message}
    </div>
  );
}
