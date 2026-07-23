"use server";

import { revalidatePath } from "next/cache";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { recordAuditLog } from "@/server/services/audit-log-service";
import { recordAdGenerated } from "@/server/services/analytics-service";
import {
  AdvertisementNotFoundError,
  buildAdvertisementPrompt,
  editAdvertisement,
  saveAdvertisement,
} from "@/server/services/advertisement-service";
import { PropertyNotFoundError } from "@/server/services/property-service";
import {
  buildAdvertisementPromptSchema,
  editAdvertisementSchema,
  saveAdvertisementSchema,
} from "@/lib/validation/advertisement";
import { fieldErrorsFromZod, type ActionState } from "@/lib/forms/action-state";
import {
  idleAdvertisementPromptState,
  type AdvertisementPromptState,
} from "@/lib/advertisement/types";

export async function buildAdvertisementPromptAction(
  _prevState: AdvertisementPromptState,
  formData: FormData,
): Promise<AdvertisementPromptState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = buildAdvertisementPromptSchema.safeParse({
    propertyId,
    channel: formData.get("channel"),
    tone: formData.get("tone"),
    size: formData.get("size"),
    objective: formData.get("objective"),
    targetAudience: formData.get("targetAudience"),
    highlightAspects: formData.getAll("highlightAspects"),
  });

  if (!parsed.success) {
    return {
      ...idleAdvertisementPromptState,
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const prompt = await buildAdvertisementPrompt(broker.id, parsed.data);
    return {
      status: "success",
      message: "Prompt pronto — copie e leve para a ferramenta de IA de sua escolha.",
      prompt,
      selection: {
        channel: parsed.data.channel,
        tone: parsed.data.tone,
        size: parsed.data.size,
        objective: parsed.data.objective,
        targetAudience: parsed.data.targetAudience ?? null,
        highlightAspects: parsed.data.highlightAspects,
      },
    };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { ...idleAdvertisementPromptState, status: "error", message: error.message };
    }
    throw error;
  }
}

export async function saveAdvertisementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const propertyId = String(formData.get("propertyId"));

  const parsed = saveAdvertisementSchema.safeParse({
    propertyId,
    channel: formData.get("channel"),
    tone: formData.get("tone"),
    size: formData.get("size"),
    objective: formData.get("objective"),
    targetAudience: formData.get("targetAudience"),
    highlightAspects: formData.getAll("highlightAspects"),
    title: formData.get("title"),
    content: formData.get("content"),
    callToAction: formData.get("callToAction"),
    hashtags: String(formData.get("hashtags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const advertisement = await saveAdvertisement(broker.id, parsed.data);
    await recordAuditLog({
      userId: broker.userId,
      action: "ADVERTISEMENT_GENERATED",
      entityType: "GeneratedAdvertisement",
      entityId: advertisement.id,
      safeMetadata: { propertyId, channel: parsed.data.channel, tone: parsed.data.tone },
    });
    await recordAdGenerated(broker.id, propertyId);
    revalidatePath(`/painel/imoveis/${propertyId}/anuncios`);
    return { status: "success", message: "Anúncio salvo." };
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function editAdvertisementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const broker = await requireBrokerProfile();
  const advertisementId = String(formData.get("advertisementId"));
  const propertyId = String(formData.get("propertyId"));

  const parsed = editAdvertisementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    callToAction: formData.get("callToAction"),
    hashtags: String(formData.get("hashtags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await editAdvertisement(advertisementId, broker.id, parsed.data);
    await recordAuditLog({
      userId: broker.userId,
      action: "ADVERTISEMENT_EDITED",
      entityType: "GeneratedAdvertisement",
      entityId: advertisementId,
    });
    revalidatePath(`/painel/imoveis/${propertyId}/anuncios`);
    return { status: "success", message: "Anúncio atualizado." };
  } catch (error) {
    if (error instanceof AdvertisementNotFoundError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}
