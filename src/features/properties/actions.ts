"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { recordAuditLog } from "@/server/services/audit-log-service";
import {
  InvalidStatusTransitionError,
  PropertyNotFoundError,
  PublicationRequirementsError,
  changePropertyStatus,
  createDraftProperty,
  deleteProperty,
  duplicateProperty,
  restoreProperty,
  saveBasicInfo,
  saveCharacteristics,
  saveDescription,
  saveLocation,
} from "@/server/services/property-service";
import {
  MediaNotFoundError,
  TooManyPhotosError,
  UnsupportedImageFormatError,
  UploadTooLargeError,
  deletePropertyPhoto,
  movePropertyPhoto,
  setCoverPhoto,
  setPhotoAltText,
  uploadPropertyPhotos,
} from "@/server/services/property-media-service";
import {
  basicInfoSchema,
  characteristicsSchema,
  descriptionSchema,
  locationSchema,
} from "@/lib/validation/property";
import { fieldErrorsFromZod, type ActionState } from "@/lib/forms/action-state";
import { PROPERTY_STATUS_LABELS } from "@/lib/property/labels";
import type { PropertyStatus } from "@/generated/prisma/client";

function revalidatePropertyPaths(propertyId: string): void {
  revalidatePath("/painel/imoveis");
  revalidatePath(`/painel/imoveis/${propertyId}`);
}

export async function createPropertyAction(): Promise<void> {
  const broker = await requireBrokerProfile();
  const property = await createDraftProperty(broker.id);

  await recordAuditLog({
    userId: broker.userId,
    action: "PROPERTY_CREATED",
    entityType: "Property",
    entityId: property.id,
  });

  revalidatePath("/painel/imoveis");
  redirect(`/painel/imoveis/${property.id}`);
}

export async function saveBasicInfoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = basicInfoSchema.safeParse({
    internalTitle: formData.get("internalTitle"),
    publicTitle: formData.get("publicTitle"),
    referenceCode: formData.get("referenceCode"),
    purpose: formData.get("purpose"),
    propertyType: formData.get("propertyType"),
    price: formData.get("price"),
    showPrice: formData.get("showPrice"),
    condominiumFee: formData.get("condominiumFee"),
    propertyTax: formData.get("propertyTax"),
    featured: formData.get("featured"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await saveBasicInfo(propertyId, broker.id, parsed.data);
    revalidatePropertyPaths(propertyId);
    return { status: "success", message: "Informações básicas salvas." };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function saveCharacteristicsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = characteristicsSchema.safeParse({
    bedrooms: formData.get("bedrooms"),
    suites: formData.get("suites"),
    bathrooms: formData.get("bathrooms"),
    parkingSpaces: formData.get("parkingSpaces"),
    totalArea: formData.get("totalArea"),
    builtArea: formData.get("builtArea"),
    constructionYear: formData.get("constructionYear"),
    furnished: formData.get("furnished"),
    petFriendly: formData.get("petFriendly"),
    financingAccepted: formData.get("financingAccepted"),
    exchangeAccepted: formData.get("exchangeAccepted"),
    features: formData.getAll("features"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await saveCharacteristics(propertyId, broker.id, parsed.data);
    revalidatePropertyPaths(propertyId);
    return { status: "success", message: "Características salvas." };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function saveLocationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = locationSchema.safeParse({
    zipCode: formData.get("zipCode"),
    state: formData.get("state"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    referencePoint: formData.get("referencePoint"),
    visibilityType: formData.get("visibilityType"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await saveLocation(propertyId, broker.id, parsed.data);
    revalidatePropertyPaths(propertyId);
    return { status: "success", message: "Localização salva." };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function saveDescriptionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = descriptionSchema.safeParse({
    description: formData.get("description"),
    highlights: formData.get("highlights"),
    nearbyPlaces: formData.get("nearbyPlaces"),
    commercialConditions: formData.get("commercialConditions"),
    internalNotes: formData.get("internalNotes"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await saveDescription(propertyId, broker.id, parsed.data);
    revalidatePropertyPaths(propertyId);
    return { status: "success", message: "Descrição salva." };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

/**
 * Publicar e despublicar são, na prática, as transições de status
 * DRAFT/INACTIVE → AVAILABLE, AVAILABLE → INACTIVE ("despublicar") e as
 * demais mudanças de status (reservar/vender/alugar) — todas passando
 * pela mesma validação de transição de `changePropertyStatus`, nunca
 * pulando a regra (RN-027). Unificar num único action é o que permite à
 * UI usar um único `useActionState` para todos os botões de ciclo de
 * vida do imóvel, evitando ambiguidade sobre qual mensagem exibir
 * quando mais de um botão já foi usado na mesma sessão.
 */
export async function changeStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const status = String(formData.get("status")) as PropertyStatus;

  try {
    const updated = await changePropertyStatus(propertyId, broker.id, status);
    await recordAuditLog({
      userId: broker.userId,
      action:
        status === "AVAILABLE"
          ? "PROPERTY_PUBLISHED"
          : status === "INACTIVE"
            ? "PROPERTY_UNPUBLISHED"
            : "PROPERTY_STATUS_CHANGED",
      entityType: "Property",
      entityId: propertyId,
      safeMetadata: { status },
    });
    revalidatePropertyPaths(propertyId);

    if (status === "AVAILABLE") {
      return { status: "success", message: "Imóvel publicado." };
    }
    if (status === "INACTIVE") {
      return { status: "success", message: "Imóvel despublicado." };
    }
    return {
      status: "success",
      message: `Status alterado para "${PROPERTY_STATUS_LABELS[updated.status]}".`,
    };
  } catch (error) {
    if (error instanceof PublicationRequirementsError) {
      return { status: "error", message: error.reasons.join(" ") };
    }
    if (error instanceof InvalidStatusTransitionError || error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function duplicatePropertyAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const duplicated = await duplicateProperty(propertyId, broker.id);
  await recordAuditLog({
    userId: broker.userId,
    action: "PROPERTY_DUPLICATED",
    entityType: "Property",
    entityId: duplicated.id,
    safeMetadata: { sourcePropertyId: propertyId },
  });

  revalidatePath("/painel/imoveis");
  redirect(`/painel/imoveis/${duplicated.id}`);
}

export async function deletePropertyAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  await deleteProperty(propertyId, broker.id);
  await recordAuditLog({
    userId: broker.userId,
    action: "PROPERTY_DELETED",
    entityType: "Property",
    entityId: propertyId,
  });

  revalidatePath("/painel/imoveis");
  redirect("/painel/imoveis");
}

export async function restorePropertyAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  await restoreProperty(propertyId, broker.id);
  await recordAuditLog({
    userId: broker.userId,
    action: "PROPERTY_RESTORED",
    entityType: "Property",
    entityId: propertyId,
  });

  revalidatePath("/painel/imoveis");
  redirect(`/painel/imoveis/${propertyId}`);
}

export async function uploadPhotosAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { status: "error", message: "Selecione ao menos uma foto." };
  }

  try {
    await uploadPropertyPhotos(propertyId, broker.id, files);
    revalidatePropertyPaths(propertyId);
    return { status: "success", message: `${files.length} foto(s) enviada(s) com sucesso.` };
  } catch (error) {
    if (
      error instanceof UnsupportedImageFormatError ||
      error instanceof UploadTooLargeError ||
      error instanceof TooManyPhotosError ||
      error instanceof PropertyNotFoundError
    ) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const mediaId = String(formData.get("mediaId"));

  try {
    await deletePropertyPhoto(propertyId, broker.id, mediaId);
  } catch (error) {
    if (!(error instanceof MediaNotFoundError)) {
      throw error;
    }
  }

  revalidatePropertyPaths(propertyId);
}

export async function setCoverPhotoAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const mediaId = String(formData.get("mediaId"));

  await setCoverPhoto(propertyId, broker.id, mediaId);
  revalidatePropertyPaths(propertyId);
}

export async function movePhotoAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const mediaId = String(formData.get("mediaId"));
  const direction = formData.get("direction") === "up" ? "up" : "down";

  await movePropertyPhoto(propertyId, broker.id, mediaId, direction);
  revalidatePropertyPaths(propertyId);
}

export async function setPhotoAltTextAction(formData: FormData): Promise<void> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));
  const mediaId = String(formData.get("mediaId"));
  const altText = String(formData.get("altText") ?? "");

  try {
    await setPhotoAltText(propertyId, broker.id, mediaId, altText);
  } catch (error) {
    if (!(error instanceof MediaNotFoundError)) {
      throw error;
    }
  }

  revalidatePropertyPaths(propertyId);
}
