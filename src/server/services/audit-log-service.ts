import { auditLogRepository } from "@/server/repositories/audit-log-repository";
import { logger } from "@/lib/observability/logger";
import type { Prisma } from "@/generated/prisma/client";

export interface RecordAuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  safeMetadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
}

/**
 * Registra um evento de auditoria (RN-094). Nunca lança: uma falha ao
 * registrar auditoria não pode derrubar o fluxo principal (ex.: login),
 * mas é sempre logada para investigação.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await auditLogRepository.create(input);
  } catch (error) {
    logger.error("Falha ao registrar evento de auditoria", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}
