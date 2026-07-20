import { prisma } from "@/lib/database/prisma";
import type { BrokerProfile } from "@/generated/prisma/client";

export type BrokerProfileWriteInput = Omit<
  BrokerProfile,
  "id" | "userId" | "catalogEnabled" | "createdAt" | "updatedAt"
>;

export const brokerProfileRepository = {
  async findByUserId(userId: string): Promise<BrokerProfile | null> {
    return prisma.brokerProfile.findUnique({ where: { userId } });
  },

  async findBySlug(slug: string): Promise<BrokerProfile | null> {
    return prisma.brokerProfile.findUnique({ where: { slug } });
  },

  /**
   * RN-025: cada conta possui no máximo um perfil — upsert por userId
   * garante isso no nível de aplicação, e o `@unique` no schema garante
   * no nível de banco.
   */
  async upsertByUserId(userId: string, data: BrokerProfileWriteInput): Promise<BrokerProfile> {
    return prisma.brokerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  async setCatalogEnabled(userId: string, enabled: boolean): Promise<BrokerProfile> {
    return prisma.brokerProfile.update({
      where: { userId },
      data: { catalogEnabled: enabled },
    });
  },

  async updatePhotoUrl(userId: string, photoUrl: string): Promise<BrokerProfile> {
    return prisma.brokerProfile.update({ where: { userId }, data: { photoUrl } });
  },

  async updateLogoUrl(userId: string, logoUrl: string): Promise<BrokerProfile> {
    return prisma.brokerProfile.update({ where: { userId }, data: { logoUrl } });
  },

  async isSlugTaken(slug: string, excludingUserId?: string): Promise<boolean> {
    const existing = await prisma.brokerProfile.findUnique({
      where: { slug },
      select: { userId: true },
    });
    if (!existing) return false;
    return existing.userId !== excludingUserId;
  },
};
