import { CATALOG_PAGE_SIZE, propertyRepository } from "@/server/repositories/property-repository";
import { getPublicProfileBySlug } from "@/server/services/broker-profile-service";
import type { CatalogFilters } from "@/lib/validation/catalog-filters";
import { PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";
import { PropertyPurpose } from "@/generated/prisma/enums";
import type { PropertyWithRelations } from "@/server/repositories/property-repository";
import type { BrokerProfile } from "@/generated/prisma/client";

export interface PublicProperty {
  id: string;
  slug: string;
  title: string;
  purpose: string;
  propertyType: string;
  price: string | null;
  showPrice: boolean;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  totalArea: string | null;
  builtArea: string | null;
  city: string | null;
  neighborhood: string | null;
  featured: boolean;
  coverPhotoUrl: string | null;
  coverPhotoAlt: string | null;
}

export interface PublicCatalogResult {
  profile: BrokerProfile;
  properties: PublicProperty[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * RN-049: título público nunca usa `internalTitle` (pode conter
 * anotações de uso interno do corretor, não destinadas ao visitante).
 * Quando o corretor não preencheu um título público distinto, sintetiza
 * um a partir de tipo, finalidade e localização — nunca deixa o campo
 * de título vazio nem vaza o título interno.
 */
function buildPublicTitle(property: PropertyWithRelations): string {
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

/** RN-049: nunca retorna internalTitle, internalNotes, referenceCode, storageKey etc. */
function serializePublicProperty(property: PropertyWithRelations): PublicProperty {
  const cover = property.media.find((m) => m.isCover) ?? property.media[0];

  return {
    id: property.id,
    slug: property.slug ?? property.id,
    title: buildPublicTitle(property),
    purpose: PURPOSE_LABELS[property.purpose],
    propertyType: PROPERTY_TYPE_LABELS[property.propertyType],
    price: property.showPrice ? (property.price?.toString() ?? null) : null,
    showPrice: property.showPrice,
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    totalArea: property.totalArea?.toString() ?? null,
    builtArea: property.builtArea?.toString() ?? null,
    city: property.address?.city ?? null,
    neighborhood: property.address?.neighborhood ?? null,
    featured: property.featured,
    coverPhotoUrl: cover?.publicUrl ?? null,
    coverPhotoAlt: cover?.altText ?? null,
  };
}

/**
 * RN-046, RN-048: catálogo público de um corretor pelo slug — null
 * quando o corretor não existe ou o catálogo está desativado (mesma
 * regra de `getPublicProfileBySlug`, RN-022).
 */
export async function getPublicCatalog(
  slug: string,
  filters: CatalogFilters,
): Promise<PublicCatalogResult | null> {
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) {
    return null;
  }

  const { items, total, pageSize } = await propertyRepository.findPublicByBroker(
    profile.id,
    filters,
  );

  return {
    profile,
    properties: items.map(serializePublicProperty),
    total,
    page: filters.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / (pageSize || CATALOG_PAGE_SIZE))),
  };
}
