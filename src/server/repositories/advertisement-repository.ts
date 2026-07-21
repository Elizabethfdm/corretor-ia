import { prisma } from "@/lib/database/prisma";
import type { AdvertisementStatus, Prisma } from "@/generated/prisma/client";

export const advertisementRepository = {
  async create(data: Prisma.GeneratedAdvertisementCreateInput) {
    return prisma.generatedAdvertisement.create({ data });
  },

  /** RN-058: histórico por imóvel, isolado por corretor (RN-026). */
  async findManyByProperty(propertyId: string, brokerId: string) {
    return prisma.generatedAdvertisement.findMany({
      where: { propertyId, brokerId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findByIdForBroker(id: string, brokerId: string) {
    return prisma.generatedAdvertisement.findFirst({ where: { id, brokerId } });
  },

  async updateContent(
    id: string,
    data: { title: string; content: string; callToAction: string; hashtags: string[] },
  ) {
    return prisma.generatedAdvertisement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        callToAction: data.callToAction,
        hashtags: data.hashtags,
        status: "EDITED" as AdvertisementStatus,
      },
    });
  },

  /** RN-070: contagem de gerações do corretor desde uma data (limite mensal). */
  async countByBrokerSince(brokerId: string, since: Date): Promise<number> {
    return prisma.generatedAdvertisement.count({
      where: { brokerId, createdAt: { gte: since } },
    });
  },
};
