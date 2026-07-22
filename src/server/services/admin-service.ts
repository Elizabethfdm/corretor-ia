import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { adminRepository } from "@/server/repositories/admin-repository";

export interface PlatformIndicators {
  totalBrokers: number;
  totalProperties: number;
  publishedProperties: number;
}

/** RF-075: indicadores gerais da plataforma. */
export async function getPlatformIndicators(): Promise<PlatformIndicators> {
  const [totalBrokers, totalProperties, publishedProperties] = await Promise.all([
    adminRepository.countBrokers(),
    adminRepository.countProperties(),
    adminRepository.countPublishedProperties(),
  ]);

  return { totalBrokers, totalProperties, publishedProperties };
}

export interface AdminBrokerRow {
  id: string;
  userId: string;
  professionalName: string;
  email: string;
  propertyCount: number;
  banned: boolean;
}

/** RF-072: lista de corretores com contagem de imóveis e status de bloqueio. */
export async function listBrokersForAdmin(): Promise<AdminBrokerRow[]> {
  const brokers = await adminRepository.listBrokersWithPropertyCounts();
  const users = await adminRepository.findUsersByIds(brokers.map((broker) => broker.userId));
  const usersById = new Map(users.map((user) => [user.id, user]));

  return brokers.map((broker) => {
    const user = usersById.get(broker.userId);
    return {
      id: broker.id,
      userId: broker.userId,
      professionalName: broker.professionalName,
      email: user?.email ?? "",
      propertyCount: broker._count.properties,
      banned: user?.banned ?? false,
    };
  });
}

/**
 * RF-073, RN-092: bloqueia a conta — `auth.api.banUser` já revoga todas
 * as sessões ativas imediatamente (confirmado na documentação do Better
 * Auth), garantindo que o acesso ao painel é negado nas próximas
 * requisições sem precisar de verificação adicional própria.
 */
export async function blockBroker(brokerUserId: string): Promise<void> {
  await auth.api.banUser({
    body: {
      userId: brokerUserId,
      banReason: "Bloqueado pelo administrador do Corretor IA.",
    },
    headers: await headers(),
  });
}

/** RF-073: desbloqueia a conta. */
export async function unblockBroker(brokerUserId: string): Promise<void> {
  await auth.api.unbanUser({
    body: { userId: brokerUserId },
    headers: await headers(),
  });
}

export interface AdminAuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userEmail: string | null;
  createdAt: Date;
}

/** RF-074: eventos básicos de auditoria mais recentes, com o e-mail do responsável quando disponível. */
export async function listRecentAuditLog(limit = 50): Promise<AdminAuditLogRow[]> {
  const entries = await adminRepository.listRecentAuditLog(limit);
  const userIds = entries.map((entry) => entry.userId).filter((id): id is string => Boolean(id));
  const users = await adminRepository.findUsersByIds(userIds);
  const emailByUserId = new Map(users.map((user) => [user.id, user.email]));

  return entries.map((entry) => ({
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userEmail: entry.userId ? (emailByUserId.get(entry.userId) ?? null) : null,
    createdAt: entry.createdAt,
  }));
}
