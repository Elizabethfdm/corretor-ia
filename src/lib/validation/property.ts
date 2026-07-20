import { z } from "zod";
import {
  AddressVisibility,
  FeatureType,
  PropertyPurpose,
  PropertyType,
} from "@/generated/prisma/enums";

function emptyToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number) {
  return z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
}

/**
 * RN-030: mantido como string (nunca convertido para número em ponto
 * flutuante) — a conversão para `Prisma.Decimal` acontece no serviço,
 * direto a partir desta string validada.
 */
function optionalMoney(fieldLabel: string) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{1,12}(\.\d{1,2})?$/, { error: `${fieldLabel}: informe um valor válido.` })
      .optional(),
  );
}

function optionalDecimalArea(fieldLabel: string) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, { error: `${fieldLabel}: informe um valor válido.` })
      .optional(),
  );
}

function optionalNonNegativeInt(fieldLabel: string) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${fieldLabel}: informe um número válido.` })
      .int({ error: `${fieldLabel}: informe um número inteiro.` })
      .nonnegative({ error: `${fieldLabel}: não pode ser negativo.` })
      .optional(),
  );
}

export const basicInfoSchema = z.object({
  internalTitle: z
    .string()
    .trim()
    .min(2, { error: "Informe um título interno." })
    .max(150, { error: "Título muito longo." }),
  publicTitle: optionalText(150),
  referenceCode: optionalText(30),
  purpose: z.enum(PropertyPurpose, { error: "Selecione a finalidade." }),
  propertyType: z.enum(PropertyType, { error: "Selecione o tipo do imóvel." }),
  price: optionalMoney("Valor"),
  showPrice: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
  condominiumFee: optionalMoney("Condomínio"),
  propertyTax: optionalMoney("IPTU"),
  featured: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;

export const characteristicsSchema = z.object({
  bedrooms: optionalNonNegativeInt("Quartos"),
  suites: optionalNonNegativeInt("Suítes"),
  bathrooms: optionalNonNegativeInt("Banheiros"),
  parkingSpaces: optionalNonNegativeInt("Vagas"),
  totalArea: optionalDecimalArea("Área total"),
  builtArea: optionalDecimalArea("Área construída"),
  constructionYear: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Informe um ano válido." })
      .int()
      .min(1800, { error: "Ano inválido." })
      .max(new Date().getFullYear() + 5, { error: "Ano inválido." })
      .optional(),
  ),
  furnished: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  petFriendly: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  financingAccepted: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  exchangeAccepted: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  features: z.array(z.enum(FeatureType)).default([]),
});

export type CharacteristicsInput = z.infer<typeof characteristicsSchema>;

export const locationSchema = z.object({
  zipCode: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{5}-?\d{3}$/, { error: "Informe um CEP válido (ex.: 01310-100)." })
      .optional(),
  ),
  state: z.preprocess(
    (value) => {
      const empty = emptyToUndefined(value);
      return typeof empty === "string" ? empty.trim().toUpperCase() : empty;
    },
    z.string().regex(/^[A-Z]{2}$/, { error: "Use a sigla do estado (ex.: SP)." }).optional(),
  ),
  city: optionalText(100),
  neighborhood: optionalText(100),
  street: optionalText(150),
  number: optionalText(20),
  complement: optionalText(100),
  referencePoint: optionalText(150),
  visibilityType: z.enum(AddressVisibility).default(AddressVisibility.HIDDEN_EXACT),
});

export type LocationInput = z.infer<typeof locationSchema>;

export const descriptionSchema = z.object({
  description: optionalText(5000),
  highlights: optionalText(2000),
  nearbyPlaces: optionalText(2000),
  commercialConditions: optionalText(2000),
  internalNotes: optionalText(2000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

export type DescriptionInput = z.infer<typeof descriptionSchema>;

/**
 * RN-043: campos exigidos apenas para publicar, não para salvar
 * rascunho.
 */
export function getPropertyPublicationRequirementErrors(property: {
  internalTitle?: string | null;
  price?: unknown;
  showPrice: boolean;
  city?: string | null;
  neighborhood?: string | null;
  description?: string | null;
  mediaCount: number;
}): string[] {
  const errors: string[] = [];

  if (!property.internalTitle) errors.push("Informe o título do imóvel.");
  if (property.showPrice && !property.price) {
    errors.push("Informe o valor ou marque a opção \"Consulte o valor\".");
  }
  if (!property.city) errors.push("Informe a cidade do imóvel.");
  if (!property.neighborhood) errors.push("Informe o bairro do imóvel.");
  if (!property.description) errors.push("Informe a descrição do imóvel.");
  if (property.mediaCount < 1) errors.push("Adicione ao menos uma foto do imóvel.");

  return errors;
}
