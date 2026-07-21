import { CATALOG_PAGE_SIZE, propertyRepository } from "@/server/repositories/property-repository";
import { getPublicProfileBySlug } from "@/server/services/broker-profile-service";
import type { CatalogFilters } from "@/lib/validation/catalog-filters";
import { FEATURE_LABELS, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";
import { buildPublicTitle } from "@/lib/property/build-public-title";
import { AddressVisibility } from "@/generated/prisma/enums";
import type { PropertyWithRelations } from "@/server/repositories/property-repository";
import type { BrokerProfile } from "@/generated/prisma/client";

const SIMILAR_PROPERTIES_LIMIT = 4;

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

export interface PublicPropertyPhoto {
  url: string;
  alt: string | null;
  isCover: boolean;
}

export interface PublicPropertyAddress {
  city: string | null;
  neighborhood: string | null;
  /** Só preenchidos quando `visibilityType === "FULL_ADDRESS"` (RN-039, RN-040). */
  street: string | null;
  number: string | null;
  complement: string | null;
  referencePoint: string | null;
}

export interface PublicPropertyDetail extends PublicProperty {
  referenceCode: string | null;
  condominiumFee: string | null;
  propertyTax: string | null;
  constructionYear: number | null;
  furnished: boolean;
  petFriendly: boolean;
  financingAccepted: boolean;
  exchangeAccepted: boolean;
  description: string | null;
  highlights: string | null;
  nearbyPlaces: string | null;
  commercialConditions: string | null;
  features: string[];
  address: PublicPropertyAddress | null;
  photos: PublicPropertyPhoto[];
}

export interface PublicPropertyPageResult {
  profile: BrokerProfile;
  property: PublicPropertyDetail;
  similar: PublicProperty[];
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

/** RN-039, RN-040: endereço completo só quando o corretor marcou visibilidade total. */
function serializePublicAddress(
  address: PropertyWithRelations["address"],
): PublicPropertyAddress | null {
  if (!address) {
    return null;
  }

  const isFullAddress = address.visibilityType === AddressVisibility.FULL_ADDRESS;

  return {
    city: address.city,
    neighborhood: address.neighborhood,
    street: isFullAddress ? address.street : null,
    number: isFullAddress ? address.number : null,
    complement: isFullAddress ? address.complement : null,
    referencePoint: isFullAddress ? address.referencePoint : null,
  };
}

/** RN-049: mesma allowlist de `serializePublicProperty`, com os campos adicionais da página individual. */
function serializePublicPropertyDetail(property: PropertyWithRelations): PublicPropertyDetail {
  return {
    ...serializePublicProperty(property),
    referenceCode: property.referenceCode,
    condominiumFee: property.condominiumFee?.toString() ?? null,
    propertyTax: property.propertyTax?.toString() ?? null,
    constructionYear: property.constructionYear,
    furnished: property.furnished,
    petFriendly: property.petFriendly,
    financingAccepted: property.financingAccepted,
    exchangeAccepted: property.exchangeAccepted,
    description: property.description,
    highlights: property.highlights,
    nearbyPlaces: property.nearbyPlaces,
    commercialConditions: property.commercialConditions,
    features: property.features.map((f) => FEATURE_LABELS[f.featureType]),
    address: serializePublicAddress(property.address),
    photos: property.media.map((m) => ({
      url: m.publicUrl,
      alt: m.altText,
      isCover: m.isCover,
    })),
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

/**
 * RN-032, RN-046, RN-048, RN-054: página individual do imóvel — null
 * quando o corretor/catálogo não existe ou o imóvel não está disponível
 * (despublicado, excluído ou nunca existiu), sempre refletindo o estado
 * mais recente do banco (sem cache) para atender RN-054.
 */
export async function getPublicProperty(
  brokerSlug: string,
  propertySlug: string,
): Promise<PublicPropertyPageResult | null> {
  const profile = await getPublicProfileBySlug(brokerSlug);
  if (!profile) {
    return null;
  }

  const property = await propertyRepository.findPublicBySlug(profile.id, propertySlug);
  if (!property) {
    return null;
  }

  const similar = await propertyRepository.findSimilarPublic(
    profile.id,
    property.id,
    property.purpose,
    property.propertyType,
    SIMILAR_PROPERTIES_LIMIT,
  );

  return {
    profile,
    property: serializePublicPropertyDetail(property),
    similar: similar.map(serializePublicProperty),
  };
}
