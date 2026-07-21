import { headers } from "next/headers";
import { analyticsEventRepository } from "@/server/repositories/analytics-repository";
import { propertyRepository } from "@/server/repositories/property-repository";
import { buildPublicTitle } from "@/lib/property/build-public-title";
import { classifyUserAgent } from "@/lib/analytics/user-agent-category";
import { computeSessionHash, resolveClientIp } from "@/lib/analytics/session-hash";
import { logger } from "@/lib/observability/logger";
import { resolveReportDateRange } from "@/lib/validation/report-filters";
import { AnalyticsEventType } from "@/generated/prisma/enums";
import type { ReportFilters } from "@/lib/validation/report-filters";

const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutos (RN-084)

/**
 * RN-084, RN-086, RN-087: contexto da requisição atual — hash de sessão
 * sem cookie (ADR-0007), referrer só quando disponível, categoria de
 * dispositivo por User-Agent.
 */
async function resolveRequestContext() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";

  return {
    sessionHash: computeSessionHash(resolveClientIp(headersList), userAgent),
    referrer: headersList.get("referer") ?? undefined,
    userAgentCategory: classifyUserAgent(userAgent),
  };
}

/**
 * Eventos disparados por um visitante anônimo do catálogo público —
 * deduplicados por sessão (RN-084) e nunca lançam para fora (best
 * effort, mesmo padrão de `recordAuditLog`).
 */
async function recordVisitorEvent(
  brokerId: string,
  propertyId: string | null,
  eventType: AnalyticsEventType,
): Promise<void> {
  try {
    const context = await resolveRequestContext();
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);

    const alreadyRecorded = await analyticsEventRepository.existsRecent({
      brokerId,
      propertyId,
      eventType,
      sessionHash: context.sessionHash,
      since,
    });
    if (alreadyRecorded) {
      return;
    }

    await analyticsEventRepository.create({
      broker: { connect: { id: brokerId } },
      property: propertyId ? { connect: { id: propertyId } } : undefined,
      eventType,
      sessionHash: context.sessionHash,
      referrer: context.referrer,
      userAgentCategory: context.userAgentCategory,
    });
  } catch (error) {
    logger.error("Falha ao registrar evento de analytics", {
      eventType,
      brokerId,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}

/**
 * Eventos disparados por uma ação autenticada do próprio corretor
 * (geração de anúncio/arte) — sempre registrados, sem dedup por sessão
 * (não é um evento de visitante anônimo) nem contexto de User-Agent.
 */
async function recordActionEvent(
  brokerId: string,
  propertyId: string,
  eventType: AnalyticsEventType,
): Promise<void> {
  try {
    await analyticsEventRepository.create({
      broker: { connect: { id: brokerId } },
      property: { connect: { id: propertyId } },
      eventType,
    });
  } catch (error) {
    logger.error("Falha ao registrar evento de analytics", {
      eventType,
      brokerId,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}

export async function recordCatalogView(brokerId: string): Promise<void> {
  await recordVisitorEvent(brokerId, null, AnalyticsEventType.CATALOG_VIEW);
}

export async function recordPropertyView(brokerId: string, propertyId: string): Promise<void> {
  await recordVisitorEvent(brokerId, propertyId, AnalyticsEventType.PROPERTY_VIEW);
}

export async function recordWhatsappClick(brokerId: string, propertyId: string | null): Promise<void> {
  await recordVisitorEvent(brokerId, propertyId, AnalyticsEventType.WHATSAPP_CLICK);
}

export async function recordShareClick(brokerId: string, propertyId: string | null): Promise<void> {
  await recordVisitorEvent(brokerId, propertyId, AnalyticsEventType.SHARE_CLICK);
}

export async function recordCopyLink(brokerId: string, propertyId: string | null): Promise<void> {
  await recordVisitorEvent(brokerId, propertyId, AnalyticsEventType.COPY_LINK);
}

export async function recordAdGenerated(brokerId: string, propertyId: string): Promise<void> {
  await recordActionEvent(brokerId, propertyId, AnalyticsEventType.AD_GENERATED);
}

export async function recordArtGenerated(brokerId: string, propertyId: string): Promise<void> {
  await recordActionEvent(brokerId, propertyId, AnalyticsEventType.ART_GENERATED);
}

export interface ReportSummary {
  counts: Record<AnalyticsEventType, number>;
  mostViewedProperty: { propertyId: string; title: string; views: number } | null;
  isEmpty: boolean;
}

/** RF-067 a RF-071: relatório agregado, isolado por corretor (RN-082), com estado vazio claro (RN-088). */
export async function getReportSummary(brokerId: string, filters: ReportFilters): Promise<ReportSummary> {
  const { from, to } = resolveReportDateRange(filters);
  const grouped = await analyticsEventRepository.countByBrokerAndType(brokerId, from, to);

  const counts = Object.fromEntries(
    Object.values(AnalyticsEventType).map((type) => [type, grouped[type] ?? 0]),
  ) as Record<AnalyticsEventType, number>;

  let mostViewedProperty: ReportSummary["mostViewedProperty"] = null;
  const top = await analyticsEventRepository.mostViewedProperty(brokerId, from, to);
  if (top) {
    const property = await propertyRepository.findByIdForBroker(top.propertyId, brokerId);
    if (property) {
      mostViewedProperty = { propertyId: property.id, title: buildPublicTitle(property), views: top.views };
    }
  }

  const isEmpty = Object.values(counts).every((count) => count === 0);

  return { counts, mostViewedProperty, isEmpty };
}
