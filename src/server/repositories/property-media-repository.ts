import { prisma } from "@/lib/database/prisma";
import type { PropertyMedia } from "@/generated/prisma/client";

export const propertyMediaRepository = {
  async findActiveByProperty(propertyId: string): Promise<PropertyMedia[]> {
    return prisma.propertyMedia.findMany({
      where: { propertyId, deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
  },

  async findActiveById(id: string, propertyId: string): Promise<PropertyMedia | null> {
    return prisma.propertyMedia.findFirst({
      where: { id, propertyId, deletedAt: null },
    });
  },

  async create(input: {
    propertyId: string;
    storageKey: string;
    publicUrl: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    displayOrder: number;
    isCover: boolean;
  }): Promise<PropertyMedia> {
    return prisma.propertyMedia.create({ data: input });
  },

  async softDelete(id: string): Promise<void> {
    await prisma.propertyMedia.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async updateAltText(id: string, altText: string | null): Promise<void> {
    await prisma.propertyMedia.update({ where: { id }, data: { altText } });
  },

  async setCover(propertyId: string, mediaId: string): Promise<void> {
    await prisma.$transaction([
      prisma.propertyMedia.updateMany({
        where: { propertyId, isCover: true },
        data: { isCover: false },
      }),
      prisma.propertyMedia.update({ where: { id: mediaId }, data: { isCover: true } }),
    ]);
  },

  async swapDisplayOrder(
    first: { id: string; displayOrder: number },
    second: { id: string; displayOrder: number },
  ): Promise<void> {
    await prisma.$transaction([
      prisma.propertyMedia.update({
        where: { id: first.id },
        data: { displayOrder: second.displayOrder },
      }),
      prisma.propertyMedia.update({
        where: { id: second.id },
        data: { displayOrder: first.displayOrder },
      }),
    ]);
  },
};
