"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/policies/auth-policy";
import { recordAuditLog } from "@/server/services/audit-log-service";
import {
  ProfileNotFoundError,
  PublicationRequirementsError,
  SlugTakenError,
  UnsupportedImageFormatError,
  UploadTooLargeError,
  checkSlugAvailability,
  saveOwnProfile,
  setCatalogEnabled,
  uploadProfileLogo,
  uploadProfilePhoto,
} from "@/server/services/broker-profile-service";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { fieldErrorsFromZod, type ActionState } from "@/lib/forms/action-state";

function revalidateProfilePaths(slug?: string): void {
  revalidatePath("/painel");
  revalidatePath("/painel/perfil");
  if (slug) revalidatePath(`/catalogo/${slug}`);
}

export async function saveProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = brokerProfileSchema.safeParse({
    professionalName: formData.get("professionalName"),
    fullName: formData.get("fullName"),
    slug: formData.get("slug"),
    creciNumber: formData.get("creciNumber"),
    creciState: formData.get("creciState"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    commercialEmail: formData.get("commercialEmail"),
    biography: formData.get("biography"),
    city: formData.get("city"),
    state: formData.get("state"),
    businessAddress: formData.get("businessAddress"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    websiteUrl: formData.get("websiteUrl"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const profile = await saveOwnProfile(user.id, parsed.data);

    await recordAuditLog({
      userId: user.id,
      action: "BROKER_PROFILE_SAVED",
      entityType: "BrokerProfile",
      entityId: profile.id,
    });

    revalidateProfilePaths(profile.slug);
    return { status: "success", message: "Perfil salvo com sucesso." };
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return { status: "error", fieldErrors: { slug: [error.message] } };
    }
    throw error;
  }
}

export async function checkSlugAvailabilityAction(slug: string): Promise<boolean> {
  const user = await requireUser();
  return checkSlugAvailability(slug, user.id);
}

export async function toggleCatalogAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const enabled = formData.get("enabled") === "true";

  try {
    const profile = await setCatalogEnabled(user.id, enabled);

    await recordAuditLog({
      userId: user.id,
      action: enabled ? "BROKER_CATALOG_ENABLED" : "BROKER_CATALOG_DISABLED",
      entityType: "BrokerProfile",
      entityId: profile.id,
    });

    revalidateProfilePaths(profile.slug);
    return {
      status: "success",
      message: enabled ? "Catálogo publicado." : "Catálogo despublicado.",
    };
  } catch (error) {
    if (error instanceof PublicationRequirementsError) {
      return { status: "error", message: error.reasons.join(" ") };
    }
    throw error;
  }
}

async function handleImageUpload(formData: FormData, kind: "photo" | "logo"): Promise<ActionState> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo de imagem." };
  }

  try {
    const uploader = kind === "photo" ? uploadProfilePhoto : uploadProfileLogo;
    await uploader(user.id, file);

    await recordAuditLog({
      userId: user.id,
      action: kind === "photo" ? "BROKER_PHOTO_UPLOADED" : "BROKER_LOGO_UPLOADED",
      entityType: "BrokerProfile",
      entityId: user.id,
    });

    revalidateProfilePaths();
    return { status: "success", message: "Imagem atualizada com sucesso." };
  } catch (error) {
    if (
      error instanceof UnsupportedImageFormatError ||
      error instanceof UploadTooLargeError ||
      error instanceof ProfileNotFoundError
    ) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function uploadPhotoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleImageUpload(formData, "photo");
}

export async function uploadLogoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleImageUpload(formData, "logo");
}
