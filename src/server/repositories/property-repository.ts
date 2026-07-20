import { prisma } from "@/lib/database/prisma";
import type { FeatureType, Prisma, Property, PropertyStatus } from "@/generated/prisma/client";

export type PropertyWithRelations = Property & {
  address: Awaited<ReturnType<typeof prisma.propertyAddress.findFirst>>;
  features: Awaited<ReturnType<typeof prisma.propertyFeature.findMany>>;
  media: Awaited<ReturnType<typeof prisma.propertyMedia.findMany>>;
};

const WITH_RELATIONS = {
  address: true,
  features: true,
  media: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" as const } },
} satisfies Prisma.PropertyInclude;

export const propertyRepository = {
  /** RN-026: toda consulta é isolada por corretor (brokerId). */
  async findManyByBroker(brokerId: string) {
    return prisma.property.findMany({
      where: { brokerId, deletedAt: null },
      include: WITH_RELATIONS,
      orderBy: { updatedAt: "desc" },
    });
  },

  async findByIdForBroker(id: string, brokerId: string) {
    return prisma.property.findFirst({
      where: { id, brokerId, deletedAt: null },
      include: WITH_RELATIONS,
    });
  },

  async findDeletedByIdForBroker(id: string, brokerId: string) {
    return prisma.property.findFirst({
      where: { id, brokerId, NOT: { deletedAt: null } },
    });
  },

  async findManyDeletedByBroker(brokerId: string) {
    return prisma.property.findMany({
      where: { brokerId, NOT: { deletedAt: null } },
      orderBy: { deletedAt: "desc" },
    });
  },

  async create(brokerId: string, internalTitle: string, slug: string) {
    return prisma.property.create({
      data: {
        brokerId,
        internalTitle,
        slug,
        purpose: "SALE",
        propertyType: "OTHER",
        status: "DRAFT",
      },
      include: WITH_RELATIONS,
    });
  },

  async updateBasicInfo(id: string, data: Prisma.PropertyUpdateInput) {
    return prisma.property.update({ where: { id }, data, include: WITH_RELATIONS });
  },

  async isSlugTaken(brokerId: string, slug: string, excludingId?: string): Promise<boolean> {
    const existing = await prisma.property.findFirst({
      where: { brokerId, slug, NOT: excludingId ? { id: excludingId } : undefined },
      select: { id: true },
    });
    return !!existing;
  },

  async upsertAddress(propertyId: string, data: Prisma.PropertyAddressUpdateInput) {
    return prisma.propertyAddress.upsert({
      where: { propertyId },
      create: { propertyId, ...toCreateInput(data) },
      update: data,
    });
  },

  async replaceFeatures(propertyId: string, featureTypes: FeatureType[]) {
    await prisma.$transaction([
      prisma.propertyFeature.deleteMany({ where: { propertyId } }),
      ...(featureTypes.length > 0
        ? [
            prisma.propertyFeature.createMany({
              data: featureTypes.map((featureType) => ({ propertyId, featureType })),
            }),
          ]
        : []),
    ]);
  },

  async updateDescription(id: string, data: Prisma.PropertyUpdateInput) {
    return prisma.property.update({ where: { id }, data, include: WITH_RELATIONS });
  },

  async updateStatus(id: string, status: PropertyStatus, publishedAt?: Date | null) {
    return prisma.property.update({
      where: { id },
      data: { status, ...(publishedAt !== undefined ? { publishedAt } : {}) },
      include: WITH_RELATIONS,
    });
  },

  async softDelete(id: string) {
    return prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async restore(id: string) {
    return prisma.property.update({ where: { id }, data: { deletedAt: null } });
  },

  async countByBroker(brokerId: string): Promise<number> {
    return prisma.property.count({ where: { brokerId, deletedAt: null } });
  },
};

function toCreateInput(
  data: Prisma.PropertyAddressUpdateInput,
): Prisma.PropertyAddressCreateWithoutPropertyInput {
  return data as Prisma.PropertyAddressCreateWithoutPropertyInput;
}
