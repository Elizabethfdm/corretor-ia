import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const artworkRepository = {
  async create(data: Prisma.GeneratedArtworkCreateInput) {
    return prisma.generatedArtwork.create({ data });
  },

  /** RN-058-like histórico por imóvel, isolado por corretor (RN-026). */
  async findManyByProperty(propertyId: string, brokerId: string) {
    return prisma.generatedArtwork.findMany({
      where: { propertyId, brokerId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findByIdForBroker(id: string, brokerId: string) {
    return prisma.generatedArtwork.findFirst({ where: { id, brokerId } });
  },
};
