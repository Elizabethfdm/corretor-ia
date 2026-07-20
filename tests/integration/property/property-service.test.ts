import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { saveOwnProfile } from "@/server/services/broker-profile-service";
import {
  InvalidStatusTransitionError,
  PropertyNotFoundError,
  PublicationRequirementsError,
  changePropertyStatus,
  createDraftProperty,
  deleteProperty,
  duplicateProperty,
  getOwnProperty,
  listOwnProperties,
  restoreProperty,
  saveBasicInfo,
  saveCharacteristics,
  saveDescription,
  saveLocation,
} from "@/server/services/property-service";

const testEmails: string[] = [];

async function createBroker(label: string): Promise<string> {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  const result = await auth.api.signUpEmail({
    body: { name: label, email, password: "senha1234" },
  });
  const profile = await saveOwnProfile(
    result.user.id,
    brokerProfileSchema.parse({
      professionalName: label,
      fullName: label,
      slug: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  );
  return profile.id;
}

afterEach(async () => {
  if (testEmails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      // Property tem onDelete: Cascade a partir de BrokerProfile.
      await prisma.brokerProfile.deleteMany({ where: { userId: { in: userIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("createDraftProperty", () => {
  it("cria um rascunho com título e slug padrão", async () => {
    const brokerId = await createBroker("draft-broker");
    const property = await createDraftProperty(brokerId);

    expect(property.internalTitle).toBe("Novo imóvel");
    expect(property.status).toBe("DRAFT");
    expect(property.slug).toMatch(/^novo-imovel-[0-9a-f]{6}$/);
    expect(property.publishedAt).toBeNull();
  });
});

describe("saveBasicInfo", () => {
  it("preserva a precisão decimal do valor (RN-030)", async () => {
    const brokerId = await createBroker("price-broker");
    const draft = await createDraftProperty(brokerId);

    const updated = await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Casa com piscina",
      purpose: "SALE",
      propertyType: "HOUSE",
      price: "450000.50",
      showPrice: true,
      featured: false,
    });

    expect(updated.price?.toString()).toBe("450000.5");
  });

  it("regera o slug a partir do título enquanto o imóvel não foi publicado (RN-031)", async () => {
    const brokerId = await createBroker("slug-broker");
    const draft = await createDraftProperty(brokerId);
    const originalSlug = draft.slug;

    const updated = await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Cobertura Duplex na Barra",
      purpose: "SALE",
      propertyType: "PENTHOUSE",
      showPrice: true,
      featured: false,
    });

    expect(updated.slug).not.toBe(originalSlug);
    expect(updated.slug).toMatch(/^cobertura-duplex-na-barra-[0-9a-f]{6}$/);
  });

  it("congela o slug depois que o imóvel foi publicado", async () => {
    const brokerId = await createBroker("slug-freeze-broker");
    const draft = await createDraftProperty(brokerId);

    await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Casa completa",
      purpose: "SALE",
      propertyType: "HOUSE",
      price: "300000",
      showPrice: true,
      featured: false,
    });
    await saveLocation(draft.id, brokerId, {
      city: "São Paulo",
      neighborhood: "Centro",
      visibilityType: "HIDDEN_EXACT",
    });
    await saveDescription(draft.id, brokerId, { description: "Descrição completa." });
    await prisma.propertyMedia.create({
      data: {
        propertyId: draft.id,
        storageKey: "fake-key",
        publicUrl: "https://example.com/fake.jpg",
        mimeType: "image/jpeg",
        size: 100,
        isCover: true,
      },
    });

    const published = await changePropertyStatus(draft.id, brokerId, "AVAILABLE");
    const slugAfterPublish = published.slug;

    const updatedAfterPublish = await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Casa completa - Título alterado",
      purpose: "SALE",
      propertyType: "HOUSE",
      price: "300000",
      showPrice: true,
      featured: false,
    });

    expect(updatedAfterPublish.slug).toBe(slugAfterPublish);
  });
});

describe("saveCharacteristics", () => {
  it("salva características e substitui a lista de comodidades", async () => {
    const brokerId = await createBroker("features-broker");
    const draft = await createDraftProperty(brokerId);

    await saveCharacteristics(draft.id, brokerId, {
      bedrooms: 3,
      suites: 1,
      bathrooms: 2,
      parkingSpaces: 2,
      furnished: true,
      petFriendly: false,
      financingAccepted: true,
      exchangeAccepted: false,
      features: ["POOL", "BARBECUE"],
    });

    const first = await getOwnProperty(draft.id, brokerId);
    expect(first.bedrooms).toBe(3);
    expect(first.features.map((f) => f.featureType).sort()).toEqual(["BARBECUE", "POOL"]);

    await saveCharacteristics(draft.id, brokerId, {
      bedrooms: 3,
      furnished: true,
      petFriendly: false,
      financingAccepted: true,
      exchangeAccepted: false,
      features: ["GARDEN"],
    });

    const second = await getOwnProperty(draft.id, brokerId);
    expect(second.features.map((f) => f.featureType)).toEqual(["GARDEN"]);
  });
});

describe("saveLocation", () => {
  it("faz upsert do endereço do imóvel", async () => {
    const brokerId = await createBroker("location-broker");
    const draft = await createDraftProperty(brokerId);

    await saveLocation(draft.id, brokerId, {
      city: "Recife",
      neighborhood: "Boa Viagem",
      visibilityType: "FULL_ADDRESS",
    });

    const first = await getOwnProperty(draft.id, brokerId);
    expect(first.address?.city).toBe("Recife");

    await saveLocation(draft.id, brokerId, {
      city: "Olinda",
      neighborhood: "Carmo",
      visibilityType: "HIDDEN_EXACT",
    });

    const second = await getOwnProperty(draft.id, brokerId);
    expect(second.address?.city).toBe("Olinda");
  });
});

describe("Isolamento entre corretores (RN-026)", () => {
  it("um corretor não enxerga nem edita imóvel de outro corretor", async () => {
    const brokerA = await createBroker("iso-broker-a");
    const brokerB = await createBroker("iso-broker-b");

    const property = await createDraftProperty(brokerA);

    await expect(getOwnProperty(property.id, brokerB)).rejects.toThrow(PropertyNotFoundError);

    const listA = await listOwnProperties(brokerA);
    const listB = await listOwnProperties(brokerB);
    expect(listA.map((p) => p.id)).toContain(property.id);
    expect(listB.map((p) => p.id)).not.toContain(property.id);
  });
});

describe("Publicação (RN-043)", () => {
  async function makeIncompleteDraft(brokerId: string) {
    return createDraftProperty(brokerId);
  }

  it("bloqueia a publicação listando todos os requisitos ausentes", async () => {
    const brokerId = await createBroker("pub-block-broker");
    const draft = await makeIncompleteDraft(brokerId);

    await expect(changePropertyStatus(draft.id, brokerId, "AVAILABLE")).rejects.toThrow(
      PublicationRequirementsError,
    );

    try {
      await changePropertyStatus(draft.id, brokerId, "AVAILABLE");
    } catch (error) {
      expect(error).toBeInstanceOf(PublicationRequirementsError);
      if (error instanceof PublicationRequirementsError) {
        expect(error.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it("publica quando todos os requisitos mínimos são atendidos", async () => {
    const brokerId = await createBroker("pub-ok-broker");
    const draft = await createDraftProperty(brokerId);

    await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Apartamento pronto para publicar",
      purpose: "RENT",
      propertyType: "APARTMENT",
      price: "2500",
      showPrice: true,
      featured: false,
    });
    await saveLocation(draft.id, brokerId, {
      city: "Belo Horizonte",
      neighborhood: "Savassi",
      visibilityType: "HIDDEN_EXACT",
    });
    await saveDescription(draft.id, brokerId, { description: "Apartamento completo e mobiliado." });
    await prisma.propertyMedia.create({
      data: {
        propertyId: draft.id,
        storageKey: "fake-key-2",
        publicUrl: "https://example.com/fake2.jpg",
        mimeType: "image/jpeg",
        size: 100,
        isCover: true,
      },
    });

    const published = await changePropertyStatus(draft.id, brokerId, "AVAILABLE");
    expect(published.status).toBe("AVAILABLE");
    expect(published.publishedAt).not.toBeNull();
  });
});

describe("changePropertyStatus (RN-027)", () => {
  it("rejeita transições fora do mapa permitido", async () => {
    const brokerId = await createBroker("transition-broker");
    const draft = await createDraftProperty(brokerId);

    // DRAFT só pode ir para AVAILABLE, nunca direto para SOLD.
    await expect(changePropertyStatus(draft.id, brokerId, "SOLD")).rejects.toThrow(
      InvalidStatusTransitionError,
    );
  });

  it("permite reservar, marcar como vendido e reativar", async () => {
    const brokerId = await createBroker("transition-ok-broker");
    const draft = await createDraftProperty(brokerId);

    await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Terreno para transição",
      purpose: "SALE",
      propertyType: "LAND",
      price: "100000",
      showPrice: true,
      featured: false,
    });
    await saveLocation(draft.id, brokerId, {
      city: "Curitiba",
      neighborhood: "Batel",
      visibilityType: "HIDDEN_EXACT",
    });
    await saveDescription(draft.id, brokerId, { description: "Terreno plano." });
    await prisma.propertyMedia.create({
      data: {
        propertyId: draft.id,
        storageKey: "fake-key-3",
        publicUrl: "https://example.com/fake3.jpg",
        mimeType: "image/jpeg",
        size: 100,
        isCover: true,
      },
    });

    await changePropertyStatus(draft.id, brokerId, "AVAILABLE");
    const reserved = await changePropertyStatus(draft.id, brokerId, "RESERVED");
    expect(reserved.status).toBe("RESERVED");

    const sold = await changePropertyStatus(draft.id, brokerId, "SOLD");
    expect(sold.status).toBe("SOLD");

    const reactivated = await changePropertyStatus(draft.id, brokerId, "AVAILABLE");
    expect(reactivated.status).toBe("AVAILABLE");
  });
});

describe("duplicateProperty (RN-029)", () => {
  it("cria uma cópia como rascunho, com slug e sem código de referência", async () => {
    const brokerId = await createBroker("dup-broker");
    const draft = await createDraftProperty(brokerId);

    await saveBasicInfo(draft.id, brokerId, {
      internalTitle: "Chácara original",
      referenceCode: "REF-001",
      purpose: "SALE",
      propertyType: "FARM",
      price: "800000",
      showPrice: true,
      featured: false,
    });

    const duplicate = await duplicateProperty(draft.id, brokerId);

    expect(duplicate.id).not.toBe(draft.id);
    expect(duplicate.internalTitle).toBe("Chácara original (Cópia)");
    expect(duplicate.slug).not.toBe(draft.slug);
    expect(duplicate.status).toBe("DRAFT");
    expect(duplicate.referenceCode).toBeNull();
    expect(duplicate.price?.toString()).toBe("800000");
  });
});

describe("deleteProperty / restoreProperty (RN-028)", () => {
  it("exclui logicamente e permite restaurar", async () => {
    const brokerId = await createBroker("delete-broker");
    const draft = await createDraftProperty(brokerId);

    await deleteProperty(draft.id, brokerId);
    await expect(getOwnProperty(draft.id, brokerId)).rejects.toThrow(PropertyNotFoundError);

    const listAfterDelete = await listOwnProperties(brokerId);
    expect(listAfterDelete.map((p) => p.id)).not.toContain(draft.id);

    await restoreProperty(draft.id, brokerId);
    const restored = await getOwnProperty(draft.id, brokerId);
    expect(restored.id).toBe(draft.id);
  });
});
