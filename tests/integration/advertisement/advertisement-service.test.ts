import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import {
  createDraftProperty,
  saveBasicInfo,
  saveLocation,
} from "@/server/services/property-service";
import {
  AdvertisementLimitReachedError,
  AdvertisementNotFoundError,
  editAdvertisement,
  generateAdvertisement,
  getMonthlyAdvertisementLimit,
  listAdvertisementsForProperty,
} from "@/server/services/advertisement-service";
import { PropertyNotFoundError } from "@/server/services/property-service";
import type { GenerateAdvertisementInput } from "@/lib/validation/advertisement";

const testEmails: string[] = [];

async function createBroker(label: string): Promise<string> {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  const result = await auth.api.signUpEmail({
    body: { name: label, email, password: "senha1234" },
  });
  return result.user.id;
}

async function createBrokerProfileAndProperty(label: string) {
  const userId = await createBroker(label);
  const { saveOwnProfile } = await import("@/server/services/broker-profile-service");
  const { brokerProfileSchema } = await import("@/lib/validation/broker-profile");
  await saveOwnProfile(
    userId,
    brokerProfileSchema.parse({
      professionalName: label,
      fullName: label,
      slug: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  );
  const profile = await prisma.brokerProfile.findUniqueOrThrow({ where: { userId } });

  const property = await createDraftProperty(profile.id);
  await saveBasicInfo(property.id, profile.id, {
    internalTitle: "Anotação interna do corretor — nunca deve ir para a IA",
    purpose: "SALE",
    propertyType: "HOUSE",
    price: "450000",
    showPrice: true,
    featured: false,
  });
  await saveLocation(property.id, profile.id, {
    city: "São Paulo",
    neighborhood: "Jardim Europa",
    visibilityType: "HIDDEN_EXACT",
  });

  return { brokerId: profile.id, propertyId: property.id };
}

function buildInput(propertyId: string, overrides: Partial<GenerateAdvertisementInput> = {}) {
  return {
    propertyId,
    channel: "INSTAGRAM",
    tone: "PROFESSIONAL",
    size: "MEDIUM",
    objective: "Atrair famílias jovens",
    targetAudience: undefined,
    highlightAspects: [],
    ...overrides,
  } as GenerateAdvertisementInput;
}

afterEach(async () => {
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
});

describe("generateAdvertisement (RN-061 a RN-074)", () => {
  it("gera e persiste um anúncio com provedor/modelo registrados (RN-069)", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-generate");

    const advertisement = await generateAdvertisement(brokerId, buildInput(propertyId));

    expect(advertisement.status).toBe("GENERATED");
    expect(advertisement.provider).toBe("fake");
    expect(advertisement.model).toBeTruthy();
    expect(advertisement.title).toBeTruthy();
    expect(advertisement.content).toBeTruthy();
    expect(advertisement.callToAction).toBeTruthy();
  });

  it("nunca envia o título interno para a IA (RN-065) — usa título sintetizado", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-no-internal");

    const advertisement = await generateAdvertisement(brokerId, buildInput(propertyId));

    expect(advertisement.title).not.toContain("Anotação interna");
    expect(advertisement.content).not.toContain("Anotação interna");
  });

  it("lança PropertyNotFoundError para imóvel de outro corretor (RN-026)", async () => {
    const { propertyId } = await createBrokerProfileAndProperty("ad-iso-owner");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-iso-other");

    await expect(
      generateAdvertisement(otherBrokerId, buildInput(propertyId)),
    ).rejects.toThrow(PropertyNotFoundError);
  });

  it("bloqueia novas gerações ao atingir o limite mensal (RN-070)", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-limit");
    const limit = getMonthlyAdvertisementLimit();

    for (let i = 0; i < limit; i += 1) {
      await generateAdvertisement(brokerId, buildInput(propertyId, { objective: `Objetivo ${i}` }));
    }

    await expect(generateAdvertisement(brokerId, buildInput(propertyId))).rejects.toThrow(
      AdvertisementLimitReachedError,
    );
  });

  it("não conta gerações de outro corretor no limite (RN-026, RN-070)", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-limit-iso-a");
    const { brokerId: otherBrokerId, propertyId: otherPropertyId } =
      await createBrokerProfileAndProperty("ad-limit-iso-b");

    await generateAdvertisement(brokerId, buildInput(propertyId));

    // O outro corretor deve conseguir gerar normalmente, sem ser afetado.
    await expect(
      generateAdvertisement(otherBrokerId, buildInput(otherPropertyId)),
    ).resolves.toBeTruthy();
  });
});

describe("listAdvertisementsForProperty (RF-058, RN-026)", () => {
  it("retorna o histórico em ordem decrescente, isolado por corretor", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-history");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-history-other");

    await generateAdvertisement(brokerId, buildInput(propertyId, { objective: "Primeiro" }));
    await generateAdvertisement(brokerId, buildInput(propertyId, { objective: "Segundo" }));

    const history = await listAdvertisementsForProperty(propertyId, brokerId);
    expect(history).toHaveLength(2);
    expect(history[0]!.objective).toBe("Segundo");
    expect(history[1]!.objective).toBe("Primeiro");

    await expect(listAdvertisementsForProperty(propertyId, otherBrokerId)).rejects.toThrow(
      PropertyNotFoundError,
    );
  });
});

describe("editAdvertisement (RF-057)", () => {
  it("atualiza o conteúdo e marca como editado", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-edit");
    const advertisement = await generateAdvertisement(brokerId, buildInput(propertyId));

    const edited = await editAdvertisement(advertisement.id, brokerId, {
      title: "Título editado pelo corretor",
      content: "Texto editado.",
      callToAction: "Ligue agora!",
      hashtags: ["novaTag"],
    });

    expect(edited.status).toBe("EDITED");
    expect(edited.title).toBe("Título editado pelo corretor");
    expect(edited.hashtags).toEqual(["novaTag"]);
  });

  it("lança AdvertisementNotFoundError para anúncio de outro corretor", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-edit-iso-a");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-edit-iso-b");
    const advertisement = await generateAdvertisement(brokerId, buildInput(propertyId));

    await expect(
      editAdvertisement(advertisement.id, otherBrokerId, {
        title: "x",
        content: "x",
        callToAction: "x",
        hashtags: [],
      }),
    ).rejects.toThrow(AdvertisementNotFoundError);
  });
});
