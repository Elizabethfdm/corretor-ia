import { prisma } from "@/lib/database/prisma";
import { AnalyticsEventType, type Prisma } from "@/generated/prisma/client";

export const analyticsEventRepository = {
  async create(data: Prisma.AnalyticsEventCreateInput) {
    return prisma.analyticsEvent.create({ data });
  },

  /** RN-084: dedup — já existe um evento igual para a mesma sessão na janela? */
  async existsRecent(input: {
    brokerId: string;
    propertyId: string | null;
    eventType: AnalyticsEventType;
    sessionHash: string;
    since: Date;
  }): Promise<boolean> {
    const count = await prisma.analyticsEvent.count({
      where: {
        brokerId: input.brokerId,
        propertyId: input.propertyId,
        eventType: input.eventType,
        sessionHash: input.sessionHash,
        occurredAt: { gte: input.since },
      },
    });
    return count > 0;
  },

  /** RF-067, RN-082: contagem por tipo de evento, isolada por corretor, num período. */
  async countByBrokerAndType(
    brokerId: string,
    from: Date,
    to: Date,
  ): Promise<Partial<Record<AnalyticsEventType, number>>> {
    const grouped = await prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: { brokerId, occurredAt: { gte: from, lte: to } },
      _count: { _all: true },
    });

    return Object.fromEntries(grouped.map((row) => [row.eventType, row._count._all]));
  },

  /** RF-069: imóvel com mais `property_view` no período. */
  async mostViewedProperty(
    brokerId: string,
    from: Date,
    to: Date,
  ): Promise<{ propertyId: string; views: number } | null> {
    const grouped = await prisma.analyticsEvent.groupBy({
      by: ["propertyId"],
      where: {
        brokerId,
        eventType: AnalyticsEventType.PROPERTY_VIEW,
        propertyId: { not: null },
        occurredAt: { gte: from, lte: to },
      },
      _count: { _all: true },
      orderBy: { _count: { propertyId: "desc" } },
      take: 1,
    });

    const top = grouped[0];
    if (!top?.propertyId) {
      return null;
    }
    return { propertyId: top.propertyId, views: top._count._all };
  },
};
