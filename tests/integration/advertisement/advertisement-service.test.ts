import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import {
  createDraftProperty,
  saveBasicInfo,
  saveLocation,
} from "@/server/services/property-service";
import {
  AdvertisementNotFoundError,
  buildAdvertisementPrompt,
  editAdvertisement,
  listAdvertisementsForProperty,
  saveAdvertisement,
} from "@/server/services/advertisement-service";
import { PropertyNotFoundError } from "@/server/services/property-service";
import type {
  BuildAdvertisementPromptInput,
  SaveAdvertisementInput,
} from "@/lib/validation/advertisement";

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

function buildPromptInput(
  propertyId: string,
  overrides: Partial<BuildAdvertisementPromptInput> = {},
) {
  return {
    propertyId,
    channel: "INSTAGRAM",
    tone: "PROFESSIONAL",
    size: "MEDIUM",
    objective: "Atrair famílias jovens",
    targetAudience: undefined,
    highlightAspects: [],
    ...overrides,
  } as BuildAdvertisementPromptInput;
}

function buildSaveInput(propertyId: string, overrides: Partial<SaveAdvertisementInput> = {}) {
  return {
    ...buildPromptInput(propertyId),
    title: "Casa incrível em Jardim Europa",
    content: "Texto do anúncio colado do ChatGPT.",
    callToAction: "Fale conosco!",
    hashtags: [],
    ...overrides,
  } as SaveAdvertisementInput;
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

describe("buildAdvertisementPrompt (RN-061 a RN-065)", () => {
  it("monta o prompt sem persistir nada", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-prompt");

    const prompt = await buildAdvertisementPrompt(brokerId, buildPromptInput(propertyId));

    expect(prompt).toContain("TÍTULO:");
    expect(prompt).toContain("Jardim Europa, São Paulo");

    const history = await listAdvertisementsForProperty(propertyId, brokerId);
    expect(history).toHaveLength(0);
  });

  it("nunca inclui o título interno no prompt (RN-065) — usa título sintetizado", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-no-internal");

    const prompt = await buildAdvertisementPrompt(brokerId, buildPromptInput(propertyId));

    expect(prompt).not.toContain("Anotação interna");
  });

  it("lança PropertyNotFoundError para imóvel de outro corretor (RN-026)", async () => {
    const { propertyId } = await createBrokerProfileAndProperty("ad-iso-owner");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-iso-other");

    await expect(
      buildAdvertisementPrompt(otherBrokerId, buildPromptInput(propertyId)),
    ).rejects.toThrow(PropertyNotFoundError);
  });
});

describe("saveAdvertisement (RF-055, RF-058)", () => {
  it("persiste o anúncio colado com provider/model fixos do fluxo manual", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-save");

    const advertisement = await saveAdvertisement(brokerId, buildSaveInput(propertyId));

    expect(advertisement.status).toBe("GENERATED");
    expect(advertisement.provider).toBe("manual");
    expect(advertisement.model).toBe("chatgpt-web");
    expect(advertisement.title).toBe("Casa incrível em Jardim Europa");
    expect(advertisement.content).toBeTruthy();
    expect(advertisement.callToAction).toBeTruthy();
  });

  it("lança PropertyNotFoundError para imóvel de outro corretor (RN-026)", async () => {
    const { propertyId } = await createBrokerProfileAndProperty("ad-save-iso-owner");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-save-iso-other");

    await expect(saveAdvertisement(otherBrokerId, buildSaveInput(propertyId))).rejects.toThrow(
      PropertyNotFoundError,
    );
  });
});

describe("listAdvertisementsForProperty (RF-058, RN-026)", () => {
  it("retorna o histórico em ordem decrescente, isolado por corretor", async () => {
    const { brokerId, propertyId } = await createBrokerProfileAndProperty("ad-history");
    const { brokerId: otherBrokerId } = await createBrokerProfileAndProperty("ad-history-other");

    await saveAdvertisement(brokerId, buildSaveInput(propertyId, { objective: "Primeiro" }));
    await saveAdvertisement(brokerId, buildSaveInput(propertyId, { objective: "Segundo" }));

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
    const advertisement = await saveAdvertisement(brokerId, buildSaveInput(propertyId));

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
    const advertisement = await saveAdvertisement(brokerId, buildSaveInput(propertyId));

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
