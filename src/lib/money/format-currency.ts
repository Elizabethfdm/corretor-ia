/**
 * Formata um valor monetário em real brasileiro para exibição (RN-030).
 * Nunca deve ser usado como fonte de persistência — apenas exibição.
 */
export function formatCurrencyBRL(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}
