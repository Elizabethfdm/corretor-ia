import { formatCurrencyBRL } from "@/lib/money/format-currency";

/**
 * RN-055: nunca inclui campo vazio ou sequência em branco na mensagem —
 * cada parte só entra se tiver conteúdo real.
 */
export function buildPropertyShareText(input: {
  title: string;
  price?: string | null;
  showPrice: boolean;
  city?: string | null;
  neighborhood?: string | null;
}): string {
  const parts = [input.title];

  if (input.showPrice) {
    const formatted = formatCurrencyBRL(input.price);
    if (formatted) parts.push(formatted);
  }

  const location = [input.neighborhood, input.city].filter(Boolean).join(", ");
  if (location) parts.push(location);

  return parts.join(" — ");
}

export function buildCatalogShareText(professionalName: string): string {
  return `Confira o catálogo de imóveis de ${professionalName}`;
}
