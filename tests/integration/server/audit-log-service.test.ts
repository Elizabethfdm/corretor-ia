import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/database/prisma";
import { recordAuditLog } from "@/server/services/audit-log-service";
import { auditLogRepository } from "@/server/repositories/audit-log-repository";

describe("recordAuditLog (RN-094)", () => {
  it("persiste um evento de auditoria no banco de dados", async () => {
    const entityId = `entity-${Date.now()}`;

    await recordAuditLog({
      action: "TEST_EVENT",
      entityType: "TestEntity",
      entityId,
      safeMetadata: { note: "evento de teste" },
    });

    const entry = await prisma.auditLog.findFirst({ where: { entityId } });
    expect(entry).not.toBeNull();
    expect(entry?.action).toBe("TEST_EVENT");

    await prisma.auditLog.deleteMany({ where: { entityId } });
  });

  it("nunca lança exceção, mesmo quando a persistência falha", async () => {
    const createSpy = vi
      .spyOn(auditLogRepository, "create")
      .mockRejectedValueOnce(new Error("falha simulada de banco de dados"));

    await expect(
      recordAuditLog({
        action: "TEST_EVENT_FAILURE",
        entityType: "TestEntity",
        entityId: "id-qualquer",
      }),
    ).resolves.toBeUndefined();

    expect(createSpy).toHaveBeenCalledOnce();
    createSpy.mockRestore();
  });
});
