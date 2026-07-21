"use server";

import { revalidatePath } from "next/cache";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { recordAuditLog } from "@/server/services/audit-log-service";
import {
  ArtworkPhotoNotFoundError,
  ArtworkRenderError,
  generateArtwork,
} from "@/server/services/artwork-service";
import { PropertyNotFoundError } from "@/server/services/property-service";
import { generateArtworkSchema } from "@/lib/validation/artwork";
import { fieldErrorsFromZod, type ActionState } from "@/lib/forms/action-state";

export async function generateArtworkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = generateArtworkSchema.safeParse({
    propertyId,
    photoMediaId: formData.get("photoMediaId"),
    format: formData.get("format"),
    templateType: formData.get("templateType"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    callToAction: formData.get("callToAction"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const artwork = await generateArtwork(broker, parsed.data);
    await recordAuditLog({
      userId: broker.userId,
      action: "ARTWORK_GENERATED",
      entityType: "GeneratedArtwork",
      entityId: artwork.id,
      safeMetadata: {
        propertyId,
        format: parsed.data.format,
        templateType: parsed.data.templateType,
      },
    });
    revalidatePath(`/painel/imoveis/${propertyId}/artes`);
    return { status: "success", message: "Arte gerada." };
  } catch (error) {
    if (
      error instanceof ArtworkPhotoNotFoundError ||
      error instanceof PropertyNotFoundError ||
      error instanceof ArtworkRenderError
    ) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}
