import { propertyRepository } from "@/server/repositories/property-repository";
import { generateSlugWithSuffix } from "@/lib/text/generate-slug-with-suffix";
import { getPropertyPublicationRequirementErrors } from "@/lib/validation/property";
import type {
  BasicInfoInput,
  CharacteristicsInput,
  DescriptionInput,
  LocationInput,
} from "@/lib/validation/property";
import { Prisma, type Property, type PropertyStatus } from "@/generated/prisma/client";

export class PropertyNotFoundError extends Error {
  constructor() {
    super("Imóvel não encontrado.");
    this.name = "PropertyNotFoundError";
  }
}

export class PublicationRequirementsError extends Error {
  constructor(public readonly reasons: string[]) {
    super("Imóvel incompleto para publicação.");
    this.name = "PublicationRequirementsError";
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor() {
    super("Não é possível aplicar essa mudança de status a partir do estado atual.");
    this.name = "InvalidStatusTransitionError";
  }
}

function toDecimalOrNull(value: string | undefined): Prisma.Decimal | null {
  return value ? new Prisma.Decimal(value) : null;
}

export async function listOwnProperties(brokerId: string) {
  return propertyRepository.findManyByBroker(brokerId);
}

/** RN-028: imóveis excluídos logicamente, disponíveis para restauração. */
export async function listDeletedProperties(brokerId: string) {
  return propertyRepository.findManyDeletedByBroker(brokerId);
}

/** RN-026: lança PropertyNotFoundError se o imóvel não pertence ao corretor. */
export async function getOwnProperty(id: string, brokerId: string) {
  const property = await propertyRepository.findByIdForBroker(id, brokerId);
  if (!property) {
    throw new PropertyNotFoundError();
  }
  return property;
}

export async function createDraftProperty(brokerId: string) {
  const title = "Novo imóvel";
  const slug = generateSlugWithSuffix(title, "imovel");
  return propertyRepository.create(brokerId, title, slug);
}

/**
 * RN-031: o slug só é regerado a partir do título enquanto o imóvel
 * nunca foi publicado — depois disso, fica estável para não quebrar
 * links já compartilhados.
 */
export async function saveBasicInfo(
  id: string,
  brokerId: string,
  input: BasicInfoInput,
): Promise<Property> {
  const property = await getOwnProperty(id, brokerId);

  const titleForSlug = input.publicTitle ?? input.internalTitle;
  const slug =
    property.publishedAt === null
      ? generateSlugWithSuffix(titleForSlug, "imovel")
      : (property.slug ?? generateSlugWithSuffix(titleForSlug, "imovel"));

  return propertyRepository.updateBasicInfo(id, {
    internalTitle: input.internalTitle,
    publicTitle: input.publicTitle ?? null,
    referenceCode: input.referenceCode ?? null,
    purpose: input.purpose,
    propertyType: input.propertyType,
    price: toDecimalOrNull(input.price),
    showPrice: input.showPrice,
    condominiumFee: toDecimalOrNull(input.condominiumFee),
    propertyTax: toDecimalOrNull(input.propertyTax),
    featured: input.featured,
    slug,
  });
}

export async function saveCharacteristics(
  id: string,
  brokerId: string,
  input: CharacteristicsInput,
): Promise<Property> {
  await getOwnProperty(id, brokerId);

  const updated = await propertyRepository.updateBasicInfo(id, {
    bedrooms: input.bedrooms ?? null,
    suites: input.suites ?? null,
    bathrooms: input.bathrooms ?? null,
    parkingSpaces: input.parkingSpaces ?? null,
    totalArea: toDecimalOrNull(input.totalArea),
    builtArea: toDecimalOrNull(input.builtArea),
    constructionYear: input.constructionYear ?? null,
    furnished: input.furnished,
    petFriendly: input.petFriendly,
    financingAccepted: input.financingAccepted,
    exchangeAccepted: input.exchangeAccepted,
  });

  await propertyRepository.replaceFeatures(id, input.features);

  return updated;
}

export async function saveLocation(
  id: string,
  brokerId: string,
  input: LocationInput,
): Promise<void> {
  await getOwnProperty(id, brokerId);

  await propertyRepository.upsertAddress(id, {
    zipCode: input.zipCode ?? null,
    state: input.state ?? null,
    city: input.city ?? null,
    neighborhood: input.neighborhood ?? null,
    street: input.street ?? null,
    number: input.number ?? null,
    complement: input.complement ?? null,
    referencePoint: input.referencePoint ?? null,
    visibilityType: input.visibilityType,
  });
}

export async function saveDescription(
  id: string,
  brokerId: string,
  input: DescriptionInput,
): Promise<Property> {
  await getOwnProperty(id, brokerId);

  return propertyRepository.updateDescription(id, {
    description: input.description ?? null,
    highlights: input.highlights ?? null,
    nearbyPlaces: input.nearbyPlaces ?? null,
    commercialConditions: input.commercialConditions ?? null,
    internalNotes: input.internalNotes ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  });
}

/** RN-043: valida os critérios mínimos antes de publicar. */
export async function publishProperty(id: string, brokerId: string): Promise<Property> {
  const property = await getOwnProperty(id, brokerId);

  const reasons = getPropertyPublicationRequirementErrors({
    internalTitle: property.internalTitle,
    price: property.price,
    showPrice: property.showPrice,
    city: property.address?.city,
    neighborhood: property.address?.neighborhood,
    description: property.description,
    mediaCount: property.media.length,
  });

  if (reasons.length > 0) {
    throw new PublicationRequirementsError(reasons);
  }

  const publishedAt = property.publishedAt ?? new Date();
  return propertyRepository.updateStatus(id, "AVAILABLE", publishedAt);
}

const ALLOWED_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  DRAFT: ["AVAILABLE"],
  AVAILABLE: ["RESERVED", "SOLD", "RENTED", "INACTIVE"],
  RESERVED: ["AVAILABLE", "SOLD", "RENTED", "INACTIVE"],
  SOLD: ["AVAILABLE", "INACTIVE"],
  RENTED: ["AVAILABLE", "INACTIVE"],
  INACTIVE: ["AVAILABLE"],
};

/**
 * RN-027: valida a transição de status contra o mapa de estados
 * permitidos. Também cobre "despublicar" (RN-032, → INACTIVE) e
 * "publicar/republicar" (→ AVAILABLE, reaplica as validações de
 * RN-043 via `publishProperty`).
 */
export async function changePropertyStatus(
  id: string,
  brokerId: string,
  targetStatus: PropertyStatus,
): Promise<Property> {
  const property = await getOwnProperty(id, brokerId);

  if (!ALLOWED_TRANSITIONS[property.status].includes(targetStatus)) {
    throw new InvalidStatusTransitionError();
  }

  if (targetStatus === "AVAILABLE") {
    return publishProperty(id, brokerId);
  }

  return propertyRepository.updateStatus(id, targetStatus);
}

/** RN-029: duplica um imóvel como novo rascunho, sem métricas nem slug público. */
export async function duplicateProperty(id: string, brokerId: string): Promise<Property> {
  const property = await getOwnProperty(id, brokerId);

  const duplicateTitle = `${property.internalTitle} (Cópia)`;
  const created = await propertyRepository.create(
    brokerId,
    duplicateTitle,
    generateSlugWithSuffix(duplicateTitle, "imovel"),
  );

  const updated = await propertyRepository.updateBasicInfo(created.id, {
    publicTitle: property.publicTitle,
    referenceCode: null,
    purpose: property.purpose,
    propertyType: property.propertyType,
    price: property.price,
    showPrice: property.showPrice,
    condominiumFee: property.condominiumFee,
    propertyTax: property.propertyTax,
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    totalArea: property.totalArea,
    builtArea: property.builtArea,
    constructionYear: property.constructionYear,
    furnished: property.furnished,
    petFriendly: property.petFriendly,
    financingAccepted: property.financingAccepted,
    exchangeAccepted: property.exchangeAccepted,
    description: property.description,
    highlights: property.highlights,
    nearbyPlaces: property.nearbyPlaces,
    commercialConditions: property.commercialConditions,
  });

  if (property.features.length > 0) {
    await propertyRepository.replaceFeatures(
      created.id,
      property.features.map((f) => f.featureType),
    );
  }

  if (property.address) {
    await propertyRepository.upsertAddress(created.id, {
      zipCode: property.address.zipCode,
      state: property.address.state,
      city: property.address.city,
      neighborhood: property.address.neighborhood,
      street: property.address.street,
      number: property.address.number,
      complement: property.address.complement,
      referencePoint: property.address.referencePoint,
      visibilityType: property.address.visibilityType,
    });
  }

  return updated;
}

/** RN-028: exclusão lógica, reversível. */
export async function deleteProperty(id: string, brokerId: string): Promise<void> {
  await getOwnProperty(id, brokerId);
  await propertyRepository.softDelete(id);
}

export async function restoreProperty(id: string, brokerId: string): Promise<void> {
  const property = await propertyRepository.findDeletedByIdForBroker(id, brokerId);
  if (!property) {
    throw new PropertyNotFoundError();
  }
  await propertyRepository.restore(id);
}
