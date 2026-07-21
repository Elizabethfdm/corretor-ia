import { PROPERTY_TYPE_LABELS } from "@/lib/property/labels";
import { PropertyPurpose } from "@/generated/prisma/enums";
import type { PropertyWithRelations } from "@/server/repositories/property-repository";

/**
 * RN-049, RN-065: título nunca usa `internalTitle` — pode conter
 * anotações de uso interno do corretor, não destinadas a terceiros
 * (nem ao público do catálogo, nem ao provedor de IA ao gerar
 * anúncios). Quando o corretor não preencheu um título público
 * distinto, sintetiza um a partir de tipo, finalidade e localização.
 */
export function buildPublicTitle(property: PropertyWithRelations): string {
  if (property.publicTitle) {
    return property.publicTitle;
  }

  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType];
  const purposeSuffix = property.purpose === PropertyPurpose.RENT ? "aluguel" : "venda";
  const location = property.address?.city
    ? ` em ${property.address.neighborhood ? `${property.address.neighborhood}, ` : ""}${property.address.city}`
    : "";

  return `${typeLabel} para ${purposeSuffix}${location}`;
}
