import { afterEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { saveOwnProfile } from "@/server/services/broker-profile-service";
import { createDraftProperty, saveBasicInfo, saveLocation } from "@/server/services/property-service";
import {
  getReportSummary,
  recordAdGenerated,
  recordArtGenerated,
  recordCatalogView,
  recordCopyLink,
  recordPropertyView,
  recordShareClick,
  recordWhatsappClick,
} from "@/server/services/analytics-service";

// `recordVisitorEvent` lê `headers()` do escopo de requisição do Next.js —
// indisponível fora de um Server Component/Action real. Mockado aqui para
// testar a lógica de dedup/contexto isoladamente (RN-084).
vi.mock("next/headers", () => ({ headers: vi.fn() }));

function mockVisitor(userAgent: string, ip = "203.0.113.10"): void {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ "user-agent": userAgent, "x-forwarded-for": ip }) as never,
  );
}

const testEmails: string[] = [];

async function createBrokerWithProperty(label: string) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  const result = await auth.api.signUpEmail({
    body: { name: label, email, password: "senha1234" },
  });
  const broker = await saveOwnProfile(
    result.user.id,
    brokerProfileSchema.parse({
      professionalName: label,
      fullName: label,
      slug: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  );

  const property = await createDraftProperty(broker.id);
  await saveBasicInfo(property.id, broker.id, {
    internalTitle: "Imóvel de teste",
    purpose: "SALE",
    propertyType: "HOUSE",
    showPrice: true,
    featured: false,
  });
  await saveLocation(property.id, broker.id, {
    city: "São Paulo",
    visibilityType: "HIDDEN_EXACT",
  });

  return { broker, propertyId: property.id };
}

afterEach(async () => {
  vi.mocked(headers).mockReset();

  if (testEmails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.brokerProfile.deleteMany({ where: { userId: { in: userIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
}, 30_000);

describe("eventos de visitante (RN-084 — dedup por sessão)", () => {
  it(
    "não duplica property_view para o mesmo visitante na janela de dedup",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-dedup");
      mockVisitor("Mozilla/5.0 visitante-A");

      await recordPropertyView(broker.id, propertyId);
      await recordPropertyView(broker.id, propertyId);

      const count = await prisma.analyticsEvent.count({
        where: { brokerId: broker.id, propertyId, eventType: "PROPERTY_VIEW" },
      });
      expect(count).toBe(1);
    },
    30_000,
  );

  it(
    "conta separadamente visitantes diferentes (User-Agent diferente)",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-dedup-multi");
      mockVisitor("Mozilla/5.0 visitante-A");
      await recordPropertyView(broker.id, propertyId);

      mockVisitor("Mozilla/5.0 visitante-B");
      await recordPropertyView(broker.id, propertyId);

      const count = await prisma.analyticsEvent.count({
        where: { brokerId: broker.id, propertyId, eventType: "PROPERTY_VIEW" },
      });
      expect(count).toBe(2);
    },
    30_000,
  );

  it(
    "registra catalog_view, whatsapp_click, share_click e copy_link",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-event-types");
      mockVisitor("Mozilla/5.0 visitante-C");

      await recordCatalogView(broker.id);
      await recordWhatsappClick(broker.id, propertyId);
      await recordShareClick(broker.id, propertyId);
      await recordCopyLink(broker.id, null);

      const events = await prisma.analyticsEvent.findMany({ where: { brokerId: broker.id } });
      const types = events.map((e) => e.eventType).sort();
      expect(types).toEqual(["CATALOG_VIEW", "COPY_LINK", "SHARE_CLICK", "WHATSAPP_CLICK"]);
    },
    30_000,
  );

  it(
    "nunca lança para fora mesmo se o registro falhar (best effort)",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-best-effort");
      vi.mocked(headers).mockRejectedValueOnce(new Error("falha simulada de contexto"));

      await expect(recordPropertyView(broker.id, propertyId)).resolves.toBeUndefined();
    },
    30_000,
  );
});

describe("eventos de ação autenticada (ad_generated, art_generated)", () => {
  it(
    "registra sem exigir contexto de requisição (sem headers())",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-action-events");

      await recordAdGenerated(broker.id, propertyId);
      await recordArtGenerated(broker.id, propertyId);

      const events = await prisma.analyticsEvent.findMany({ where: { brokerId: broker.id } });
      expect(events.map((e) => e.eventType).sort()).toEqual(["AD_GENERATED", "ART_GENERATED"]);
    },
    30_000,
  );
});

describe("getReportSummary (RF-067 a RF-071, RN-082, RN-088)", () => {
  it(
    "agrega contagens por tipo, isolado por corretor",
    async () => {
      const { broker, propertyId } = await createBrokerWithProperty("an-summary");
      const { broker: otherBroker, propertyId: otherPropertyId } =
        await createBrokerWithProperty("an-summary-other");

      await recordAdGenerated(broker.id, propertyId);
      await recordArtGenerated(broker.id, propertyId);
      await recordAdGenerated(otherBroker.id, otherPropertyId);

      const summary = await getReportSummary(broker.id, { period: "30d" } as never);
      expect(summary.counts.AD_GENERATED).toBe(1);
      expect(summary.counts.ART_GENERATED).toBe(1);
      expect(summary.counts.CATALOG_VIEW).toBe(0);
      expect(summary.isEmpty).toBe(false);

      const otherSummary = await getReportSummary(otherBroker.id, { period: "30d" } as never);
      expect(otherSummary.counts.AD_GENERATED).toBe(1);
      expect(otherSummary.counts.ART_GENERATED).toBe(0);
    },
    30_000,
  );

  it(
    "identifica o imóvel mais acessado no período (RF-069)",
    async () => {
      const { broker, propertyId: popularId } = await createBrokerWithProperty("an-most-viewed");
      const property2 = await createDraftProperty(broker.id);
      await saveBasicInfo(property2.id, broker.id, {
        internalTitle: "Imóvel menos visto",
        purpose: "SALE",
        propertyType: "APARTMENT",
        showPrice: true,
        featured: false,
      });

      mockVisitor("Mozilla/5.0 v1");
      await recordPropertyView(broker.id, popularId);
      mockVisitor("Mozilla/5.0 v2");
      await recordPropertyView(broker.id, popularId);
      mockVisitor("Mozilla/5.0 v3");
      await recordPropertyView(broker.id, property2.id);

      const summary = await getReportSummary(broker.id, { period: "30d" } as never);
      expect(summary.mostViewedProperty?.propertyId).toBe(popularId);
      expect(summary.mostViewedProperty?.views).toBe(2);
    },
    30_000,
  );

  it(
    "retorna estado vazio quando não há eventos no período (RN-088)",
    async () => {
      const { broker } = await createBrokerWithProperty("an-empty");

      const summary = await getReportSummary(broker.id, { period: "today" } as never);
      expect(summary.isEmpty).toBe(true);
      expect(summary.mostViewedProperty).toBeNull();
      expect(Object.values(summary.counts).every((count) => count === 0)).toBe(true);
    },
    30_000,
  );
});
