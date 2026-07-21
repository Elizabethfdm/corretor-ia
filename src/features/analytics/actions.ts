"use server";

import {
  recordCopyLink,
  recordShareClick,
  recordWhatsappClick,
} from "@/server/services/analytics-service";

/**
 * Server Actions públicas chamadas por visitantes anônimos do catálogo
 * (RN-089). `brokerId`/`propertyId` são os mesmos identificadores já
 * visíveis na página pública renderizada — não há dado sensível aqui,
 * apenas o registro do clique (best effort, nunca lança — ver
 * `analytics-service.ts`).
 */
export async function recordWhatsappClickAction(
  brokerId: string,
  propertyId: string | null,
): Promise<void> {
  await recordWhatsappClick(brokerId, propertyId);
}

export async function recordShareClickAction(
  brokerId: string,
  propertyId: string | null,
): Promise<void> {
  await recordShareClick(brokerId, propertyId);
}

export async function recordCopyLinkAction(
  brokerId: string,
  propertyId: string | null,
): Promise<void> {
  await recordCopyLink(brokerId, propertyId);
}
