import { formatCurrencyBRL } from "@/lib/money/format-currency";

/**
 * RF-063: texto inicial sugerido para o subtítulo da arte — o corretor
 * pode editar livremente antes de gerar. Nunca inclui campo vazio
 * (mesmo padrão de `buildPropertyShareText`).
 */
export function buildDefaultArtworkSubtitle(input: {
  bedrooms: number | null;
  totalArea: string | null;
  price: string | null;
  showPrice: boolean;
}): string {
  const parts: string[] = [];

  if (input.bedrooms) {
    parts.push(`${input.bedrooms} quartos`);
  }
  if (input.totalArea) {
    parts.push(`${input.totalArea} m²`);
  }
  if (input.showPrice) {
    const formatted = formatCurrencyBRL(input.price);
    if (formatted) parts.push(formatted);
  }

  return parts.join(" · ");
}

/** RF-063: chamada para ação inicial sugerida — editável pelo corretor. */
export function buildDefaultArtworkCallToAction(): string {
  return "Fale comigo e agende uma visita";
}
