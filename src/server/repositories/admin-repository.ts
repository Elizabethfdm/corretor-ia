import { prisma } from "@/lib/database/prisma";

export const adminRepository = {
  /** RF-072: lista de corretores com contagem de imóveis. */
  async listBrokersWithPropertyCounts() {
    return prisma.brokerProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { properties: true } } },
    });
  },

  async findUsersByIds(ids: string[]) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true, banned: true },
    });
  },

  /** RF-075: indicadores gerais da plataforma. */
  async countBrokers(): Promise<number> {
    return prisma.brokerProfile.count();
  },

  async countProperties(): Promise<number> {
    return prisma.property.count({ where: { deletedAt: null } });
  },

  async countPublishedProperties(): Promise<number> {
    return prisma.property.count({ where: { deletedAt: null, status: "AVAILABLE" } });
  },

  /** RF-074: eventos básicos de auditoria, mais recentes primeiro. */
  async listRecentAuditLog(limit: number) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
