import { z } from "zod";
import { FeatureType, PropertyPurpose, PropertyType } from "@/generated/prisma/enums";

function emptyToUndefined(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.length === 0 ? undefined : value;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function toArray(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
}

export const CATALOG_SORT_OPTIONS = [
  "recent",
  "price_asc",
  "price_desc",
  "area_desc",
  "featured",
] as const;

export type CatalogSort = (typeof CATALOG_SORT_OPTIONS)[number];

/**
 * RN-047: os filtros vêm de `searchParams` (sempre string | string[] |
 * undefined, nunca validados) — cada campo usa `.catch()` para nunca
 * derrubar a página inteira por causa de um parâmetro de URL malformado
 * ou adulterado manualmente; o campo inválido é simplesmente ignorado.
 */
export const catalogFiltersSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()).catch(undefined),
  purpose: z.preprocess(emptyToUndefined, z.enum(PropertyPurpose).optional()).catch(undefined),
  type: z.preprocess(emptyToUndefined, z.enum(PropertyType).optional()).catch(undefined),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()).catch(undefined),
  neighborhood: z
    .preprocess(emptyToUndefined, z.string().trim().max(100).optional())
    .catch(undefined),
  priceMin: z
    .preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional())
    .catch(undefined),
  priceMax: z
    .preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional())
    .catch(undefined),
  bedroomsMin: z
    .preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional())
    .catch(undefined),
  parkingMin: z
    .preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional())
    .catch(undefined),
  financingAccepted: z
    .preprocess((value) => (value === "true" ? true : undefined), z.boolean().optional())
    .catch(undefined),
  features: z.preprocess(toArray, z.array(z.enum(FeatureType)).optional()).catch(undefined),
  sort: z
    .preprocess(emptyToUndefined, z.enum(CATALOG_SORT_OPTIONS).default("recent"))
    .catch("recent"),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(1)).catch(1),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

/**
 * Converte um objeto de `searchParams` do Next.js (App Router) em
 * filtros validados. Nunca lança — entradas inválidas viram `undefined`
 * (ver `catalogFiltersSchema`).
 */
export function parseCatalogFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogFilters {
  return catalogFiltersSchema.parse(searchParams);
}

/**
 * RN-047: monta a query string dos filtros atuais (com overrides
 * opcionais) para links de paginação/ordenação que preservam o restante
 * do filtro aplicado.
 */
export function buildCatalogQueryString(
  filters: CatalogFilters,
  overrides: Partial<Record<keyof CatalogFilters, string | number | undefined>> = {},
): string {
  const params = new URLSearchParams();
  const merged = { ...filters, ...overrides };

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null) continue;
    if (key === "sort" && value === "recent") continue;
    if (key === "page" && value === 1) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
