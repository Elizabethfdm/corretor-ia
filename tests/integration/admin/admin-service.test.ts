import { afterEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { convertSetCookieToCookie } from "better-auth/test";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import {
  getPublicProfileBySlug,
  saveOwnProfile,
  setCatalogEnabled,
} from "@/server/services/broker-profile-service";
import { createDraftProperty } from "@/server/services/property-service";
import {
  blockBroker,
  getPlatformIndicators,
  listBrokersForAdmin,
  listRecentAuditLog,
  unblockBroker,
} from "@/server/services/admin-service";

// `blockBroker`/`unblockBroker` leem `headers()` do escopo de requisição
// do Next.js (repassado ao `auth.api.banUser`/`unbanUser` para o próprio
// Better Auth validar que quem chama é um administrador autenticado) —
// indisponível fora de uma Server Action real. Mockado aqui com uma
// sessão de administrador de verdade (ver `createAdminSessionHeaders`).
vi.mock("next/headers", () => ({ headers: vi.fn() }));

const PASSWORD = "senha1234";
const testEmails: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  return email;
}

async function createAdminSessionHeaders(): Promise<Headers> {
  const email = uniqueEmail("admin");
  await auth.api.signUpEmail({ body: { name: "Admin Teste", email, password: PASSWORD } });
  await prisma.user.update({ where: { email }, data: { role: "admin" } });

  const signIn = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  return convertSetCookieToCookie(signIn.headers);
}

async function createBrokerWithProperty(label: string) {
  const email = uniqueEmail(label);
  const signUp = await auth.api.signUpEmail({
    body: { name: label, email, password: PASSWORD },
  });
  const broker = await saveOwnProfile(
    signUp.user.id,
    brokerProfileSchema.parse({
      professionalName: label,
      fullName: label,
      slug: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  );

  await createDraftProperty(broker.id);

  return { userId: signUp.user.id, brokerId: broker.id, email };
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

describe("listBrokersForAdmin, getPlatformIndicators (RF-072, RF-075)", () => {
  it("lista corretores com contagem de imóveis e reflete nos indicadores gerais", async () => {
    const before = await getPlatformIndicators();
    const { brokerId, email } = await createBrokerWithProperty("admin-list");

    const brokers = await listBrokersForAdmin();
    const row = brokers.find((b) => b.id === brokerId);
    expect(row).toBeTruthy();
    expect(row?.email).toBe(email);
    expect(row?.propertyCount).toBe(1);
    expect(row?.banned).toBe(false);

    // Comparação por limite inferior, não igualdade exata: os
    // indicadores são globais por design (visão do admin), e outros
    // arquivos de teste de integração podem estar criando dados
    // concorrentemente contra o mesmo banco.
    const after = await getPlatformIndicators();
    expect(after.totalBrokers).toBeGreaterThanOrEqual(before.totalBrokers + 1);
    expect(after.totalProperties).toBeGreaterThanOrEqual(before.totalProperties + 1);
  }, 30_000);
});

describe("blockBroker / unblockBroker (RF-073, RN-092, RN-094)", () => {
  it("bloqueia a conta e revoga a sessão ativa do corretor imediatamente", async () => {
    const adminHeaders = await createAdminSessionHeaders();
    const { userId, email } = await createBrokerWithProperty("admin-block");

    const brokerSignIn = await auth.api.signInEmail({
      body: { email, password: PASSWORD },
      returnHeaders: true,
    });
    const brokerCookie = convertSetCookieToCookie(brokerSignIn.headers);

    const beforeSession = await auth.api.getSession({ headers: brokerCookie });
    expect(beforeSession?.user.id).toBe(userId);

    vi.mocked(headers).mockResolvedValue(adminHeaders as never);
    await blockBroker(userId);

    const afterSession = await auth.api.getSession({ headers: brokerCookie });
    expect(afterSession).toBeNull();

    await expect(auth.api.signInEmail({ body: { email, password: PASSWORD } })).rejects.toThrow();
  }, 30_000);

  it("desbloqueia a conta e permite login novamente", async () => {
    const adminHeaders = await createAdminSessionHeaders();
    const { userId, email } = await createBrokerWithProperty("admin-unblock");

    vi.mocked(headers).mockResolvedValue(adminHeaders as never);
    await blockBroker(userId);
    await expect(auth.api.signInEmail({ body: { email, password: PASSWORD } })).rejects.toThrow();

    await unblockBroker(userId);
    const signInAfterUnblock = await auth.api.signInEmail({
      body: { email, password: PASSWORD },
    });
    expect(signInAfterUnblock.user.id).toBe(userId);
  }, 30_000);
});

describe("getPublicProfileBySlug oculta catálogo de conta bloqueada (RN-093)", () => {
  it("retorna null para o catálogo de um corretor bloqueado, mesmo publicado", async () => {
    const email = uniqueEmail("admin-catalog-hide");
    const signUp = await auth.api.signUpEmail({
      body: { name: "Corretor Teste", email, password: PASSWORD },
    });
    const slug = `admin-catalog-hide-${Date.now()}`;
    await saveOwnProfile(
      signUp.user.id,
      brokerProfileSchema.parse({
        professionalName: "Corretor Teste",
        fullName: "Corretor Teste Completo",
        slug,
        creciNumber: "12345",
        creciState: "SP",
        whatsapp: "11999999999",
        city: "São Paulo",
      }),
    );
    await setCatalogEnabled(signUp.user.id, true);

    expect(await getPublicProfileBySlug(slug)).not.toBeNull();

    await prisma.user.update({ where: { id: signUp.user.id }, data: { banned: true } });

    expect(await getPublicProfileBySlug(slug)).toBeNull();

    testEmails.push(email);
  }, 30_000);
});

describe("listRecentAuditLog (RF-074)", () => {
  it("retorna eventos recentes com o e-mail do responsável resolvido", async () => {
    const { userId, email } = await createBrokerWithProperty("admin-audit");
    const { recordAuditLog } = await import("@/server/services/audit-log-service");
    await recordAuditLog({
      userId,
      action: "BROKER_BLOCKED",
      entityType: "User",
      entityId: userId,
    });

    const entries = await listRecentAuditLog(10);
    const entry = entries.find((e) => e.entityId === userId && e.action === "BROKER_BLOCKED");
    expect(entry).toBeTruthy();
    expect(entry?.userEmail).toBe(email);
  }, 30_000);
});
