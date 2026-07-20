interface FormMessageProps {
  status: "error" | "success";
  message: string;
}

/**
 * Mensagem de resultado do formulário (sucesso/erro) anunciada a
 * leitores de tela via aria-live (RNF-015).
 */
export function FormMessage({ status, message }: FormMessageProps) {
  const tone =
    status === "error"
      ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      : "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200";

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={`rounded-md border px-4 py-3 text-sm ${tone}`}
    >
      {message}
    </div>
  );
}
