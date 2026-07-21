import { prisma } from "@/lib/database/prisma";
import type { FeatureType, Prisma, Property, PropertyStatus } from "@/generated/prisma/client";
import type { CatalogFilters } from "@/lib/validation/catalog-filters";

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

  /**
   * RN-046: catálogo público mostra exclusivamente imóveis com status
   * "Disponível". RN-047: filtros/ordenação/paginação recebidos já
   * validados (`CatalogFilters`).
   */
  async findPublicByBroker(
    brokerId: string,
    filters: CatalogFilters,
  ): Promise<{ items: PropertyWithRelations[]; total: number; pageSize: number }> {
    const pageSize = CATALOG_PAGE_SIZE;
    const where = buildPublicWhere(brokerId, filters);
    const orderBy = buildPublicOrderBy(filters.sort);

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: WITH_RELATIONS,
        orderBy,
        skip: (filters.page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);

    return { items, total, pageSize };
  },

  /** RN-046, RN-048: página individual só resolve imóveis disponíveis. */
  async findPublicBySlug(brokerId: string, slug: string): Promise<PropertyWithRelations | null> {
    return prisma.property.findFirst({
      where: { brokerId, slug, deletedAt: null, status: "AVAILABLE" },
      include: WITH_RELATIONS,
    });
  },

  /**
   * RN-053: imóveis semelhantes nunca cruzam corretores nem incluem o
   * próprio imóvel ou imóveis indisponíveis. Prioriza mesmo tipo e
   * finalidade; completa com os mais recentes do mesmo corretor caso
   * não haja `limit` semelhantes suficientes.
   */
  async findSimilarPublic(
    brokerId: string,
    excludePropertyId: string,
    purpose: Property["purpose"],
    propertyType: Property["propertyType"],
    limit: number,
  ): Promise<PropertyWithRelations[]> {
    const baseWhere: Prisma.PropertyWhereInput = {
      brokerId,
      deletedAt: null,
      status: "AVAILABLE",
      id: { not: excludePropertyId },
    };

    const sameType = await prisma.property.findMany({
      where: { ...baseWhere, purpose, propertyType },
      include: WITH_RELATIONS,
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    if (sameType.length >= limit) {
      return sameType;
    }

    const fallback = await prisma.property.findMany({
      where: { ...baseWhere, id: { notIn: [excludePropertyId, ...sameType.map((p) => p.id)] } },
      include: WITH_RELATIONS,
      orderBy: { publishedAt: "desc" },
      take: limit - sameType.length,
    });

    return [...sameType, ...fallback];
  },
};

export const CATALOG_PAGE_SIZE = 12;

function buildPublicWhere(brokerId: string, filters: CatalogFilters): Prisma.PropertyWhereInput {
  const priceFilter =
    filters.priceMin !== undefined || filters.priceMax !== undefined
      ? {
          ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
          ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
        }
      : undefined;

  return {
    brokerId,
    deletedAt: null,
    status: "AVAILABLE",
    ...(filters.purpose ? { purpose: filters.purpose } : {}),
    ...(filters.type ? { propertyType: filters.type } : {}),
    ...(filters.city ? { address: { city: { contains: filters.city, mode: "insensitive" } } } : {}),
    ...(filters.neighborhood
      ? { address: { neighborhood: { contains: filters.neighborhood, mode: "insensitive" } } }
      : {}),
    ...(filters.bedroomsMin !== undefined ? { bedrooms: { gte: filters.bedroomsMin } } : {}),
    ...(filters.parkingMin !== undefined ? { parkingSpaces: { gte: filters.parkingMin } } : {}),
    ...(filters.financingAccepted ? { financingAccepted: true } : {}),
    ...(priceFilter ? { price: priceFilter } : {}),
    // Cada característica selecionada precisa estar presente (E lógico,
    // não OU) — uma condição `some` por característica.
    ...(filters.features && filters.features.length > 0
      ? { AND: filters.features.map((featureType) => ({ features: { some: { featureType } } })) }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { publicTitle: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { address: { city: { contains: filters.q, mode: "insensitive" } } },
            { address: { neighborhood: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

function buildPublicOrderBy(sort: CatalogFilters["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "price_desc":
      return [{ price: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "area_desc":
      return [{ totalArea: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "featured":
      return [{ featured: "desc" }, { publishedAt: "desc" }];
    case "recent":
    default:
      return [{ publishedAt: "desc" }];
  }
}

function toCreateInput(
  data: Prisma.PropertyAddressUpdateInput,
): Prisma.PropertyAddressCreateWithoutPropertyInput {
  return data as Prisma.PropertyAddressCreateWithoutPropertyInput;
}
