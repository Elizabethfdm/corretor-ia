import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/text/slugify";

/**
 * Gera um slug a partir de um título livre, com um sufixo aleatório
 * curto para garantir unicidade mesmo quando dois registros têm títulos
 * iguais/semelhantes (RN-031) — ex.: "casa-com-piscina-jardim-europa-a1b2c3".
 */
export function generateSlugWithSuffix(title: string, fallback = "item"): string {
  const base = slugify(title) || fallback;
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}
