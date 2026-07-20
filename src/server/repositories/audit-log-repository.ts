import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  safeMetadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
}

export const auditLogRepository = {
  async create(input: CreateAuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        safeMetadata: input.safeMetadata,
        ipHash: input.ipHash ?? null,
      },
    });
  },
};
