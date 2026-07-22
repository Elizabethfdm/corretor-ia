import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { saveOwnProfile, setCatalogEnabled } from "@/server/services/broker-profile-service";
import {
  changePropertyStatus,
  createDraftProperty,
  saveBasicInfo,
  saveDescription,
  saveLocation,
} from "@/server/services/property-service";
import { getPublicCatalog, getPublicProperty } from "@/server/services/catalog-service";
import { parseCatalogFilters } from "@/lib/validation/catalog-filters";
import type { BasicInfoInput, DescriptionInput, LocationInput } from "@/lib/validation/property";

const testEmails: string[] = [];

async function createPublishedBroker(label: string) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  const result = await auth.api.signUpEmail({
    body: { name: label, email, password: "senha1234" },
  });
  const slug = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveOwnProfile(
    result.user.id,
    brokerProfileSchema.parse({
      professionalName: label,
      fullName: label,
      slug,
      creciNumber: "12345",
      creciState: "SP",
      whatsapp: "11999999999",
      city: "São Paulo",
    }),
  );
  await setCatalogEnabled(result.user.id, true);

  const profile = await prisma.brokerProfile.findUniqueOrThrow({
    where: { userId: result.user.id },
  });
  return { brokerId: profile.id, slug };
}

async function createAvailableProperty(
  brokerId: string,
  overrides: Partial<BasicInfoInput> & { internalTitle: string },
  location: Partial<LocationInput> = {},
  description: Partial<DescriptionInput> = {},
) {
  const draft = await createDraftProperty(brokerId);
  await saveBasicInfo(draft.id, brokerId, {
    purpose: "SALE",
    propertyType: "HOUSE",
    price: "300000",
    showPrice: true,
    featured: false,
    ...overrides,
  });
  await saveLocation(draft.id, brokerId, {
    city: "São Paulo",
    neighborhood: "Centro",
    visibilityType: "HIDDEN_EXACT",
    ...location,
  });
  await saveDescription(draft.id, brokerId, { description: "Descrição padrão.", ...description });
  await prisma.propertyMedia.create({
    data: {
      propertyId: draft.id,
      storageKey: `fake-${draft.id}`,
      publicUrl: `https://example.com/${draft.id}.jpg`,
      mimeType: "image/jpeg",
      size: 100,
      isCover: true,
    },
  });
  return changePropertyStatus(draft.id, brokerId, "AVAILABLE");
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

describe("getPublicCatalog (RN-046, RN-048, RN-049)", () => {
  it("retorna null para slug inexistente", async () => {
    expect(await getPublicCatalog("slug-que-nunca-existiu", parseCatalogFilters({}))).toBeNull();
  });

  it("retorna null quando o catálogo está desativado", async () => {
    const email = `catalog-off-${Date.now()}@example.com`;
    testEmails.push(email);
    const result = await auth.api.signUpEmail({
      body: { name: "Corretor", email, password: "senha1234" },
    });
    const slug = `catalog-off-${Date.now()}`;
    await saveOwnProfile(
      result.user.id,
      brokerProfileSchema.parse({ professionalName: "Corretor", fullName: "Corretor", slug }),
    );

    expect(await getPublicCatalog(slug, parseCatalogFilters({}))).toBeNull();
  });

  it("mostra somente imóveis com status Disponível (RN-046)", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-status");

    await createAvailableProperty(brokerId, {
      internalTitle: "Casa disponível",
      publicTitle: "Casa disponível",
    });

    const draft = await createDraftProperty(brokerId);

    const reserved = await createAvailableProperty(brokerId, {
      internalTitle: "Casa reservada",
      publicTitle: "Casa reservada",
    });
    await changePropertyStatus(reserved.id, brokerId, "RESERVED");

    const catalog = await getPublicCatalog(slug, parseCatalogFilters({}));
    expect(catalog).not.toBeNull();
    const titles = catalog!.properties.map((p) => p.title);
    expect(titles).toContain("Casa disponível");
    expect(titles).not.toContain("Casa reservada");
    expect(catalog!.properties.some((p) => p.id === draft.id)).toBe(false);
  });

  it("isola imóveis por corretor", async () => {
    const brokerA = await createPublishedBroker("catalog-iso-a");
    const brokerB = await createPublishedBroker("catalog-iso-b");

    await createAvailableProperty(brokerA.brokerId, {
      internalTitle: "Imóvel do corretor A",
      publicTitle: "Imóvel do corretor A",
    });
    await createAvailableProperty(brokerB.brokerId, {
      internalTitle: "Imóvel do corretor B",
      publicTitle: "Imóvel do corretor B",
    });

    const catalogA = await getPublicCatalog(brokerA.slug, parseCatalogFilters({}));
    const titlesA = catalogA!.properties.map((p) => p.title);
    expect(titlesA).toContain("Imóvel do corretor A");
    expect(titlesA).not.toContain("Imóvel do corretor B");
  });

  it("nunca expõe campos internos (RN-049)", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-internal-fields");

    await createAvailableProperty(brokerId, {
      internalTitle: "Título interno secreto do corretor",
      referenceCode: "REF-INTERNO-001",
    });

    const catalog = await getPublicCatalog(slug, parseCatalogFilters({}));
    const property = catalog!.properties[0]!;

    expect(property).not.toHaveProperty("internalTitle");
    expect(property).not.toHaveProperty("internalNotes");
    expect(property).not.toHaveProperty("referenceCode");
    expect(JSON.stringify(property)).not.toContain("Título interno secreto");
    expect(JSON.stringify(property)).not.toContain("REF-INTERNO-001");
  });

  it("sintetiza um título público quando publicTitle não foi definido, sem usar internalTitle", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-synth-title");

    await createAvailableProperty(
      brokerId,
      {
        internalTitle: "Anotação interna do corretor — não mostrar",
        propertyType: "APARTMENT",
        purpose: "RENT",
      },
      { city: "Curitiba", neighborhood: "Batel" },
    );

    const catalog = await getPublicCatalog(slug, parseCatalogFilters({}));
    const title = catalog!.properties[0]!.title;

    expect(title).not.toContain("Anotação interna");
    expect(title.toLowerCase()).toContain("apartamento");
    expect(title).toContain("Batel");
  });

  it("filtra por busca de texto livre (título público, descrição, cidade, bairro)", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-search");

    await createAvailableProperty(
      brokerId,
      { internalTitle: "A", publicTitle: "Casa com piscina incrível" },
      {},
      { description: "Uma casa maravilhosa." },
    );
    await createAvailableProperty(brokerId, {
      internalTitle: "B",
      publicTitle: "Apartamento simples",
    });

    const catalog = await getPublicCatalog(slug, parseCatalogFilters({ q: "piscina" }));
    expect(catalog!.properties).toHaveLength(1);
    expect(catalog!.properties[0]!.title).toBe("Casa com piscina incrível");
  });

  it("filtra por finalidade, tipo, cidade e bairro", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-filters");

    await createAvailableProperty(
      brokerId,
      { internalTitle: "A", publicTitle: "Casa Recife", purpose: "SALE", propertyType: "HOUSE" },
      { city: "Recife", neighborhood: "Boa Viagem" },
    );
    await createAvailableProperty(
      brokerId,
      {
        internalTitle: "B",
        publicTitle: "Apartamento Olinda",
        purpose: "RENT",
        propertyType: "APARTMENT",
      },
      { city: "Olinda", neighborhood: "Carmo" },
    );

    const byPurpose = await getPublicCatalog(slug, parseCatalogFilters({ purpose: "RENT" }));
    expect(byPurpose!.properties.map((p) => p.title)).toEqual(["Apartamento Olinda"]);

    const byCity = await getPublicCatalog(slug, parseCatalogFilters({ city: "Recife" }));
    expect(byCity!.properties.map((p) => p.title)).toEqual(["Casa Recife"]);
  });

  it("filtra por faixa de preço", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-price");

    await createAvailableProperty(brokerId, {
      internalTitle: "A",
      publicTitle: "Imóvel barato",
      price: "100000",
    });
    await createAvailableProperty(brokerId, {
      internalTitle: "B",
      publicTitle: "Imóvel caro",
      price: "900000",
    });

    const catalog = await getPublicCatalog(
      slug,
      parseCatalogFilters({ priceMin: "500000", priceMax: "1000000" }),
    );
    expect(catalog!.properties.map((p) => p.title)).toEqual(["Imóvel caro"]);
  });

  it("filtra por características exigindo todas as selecionadas (E lógico)", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-features");

    const withBoth = await createAvailableProperty(brokerId, {
      internalTitle: "A",
      publicTitle: "Com piscina e churrasqueira",
    });
    await prisma.propertyFeature.createMany({
      data: [
        { propertyId: withBoth.id, featureType: "POOL" },
        { propertyId: withBoth.id, featureType: "BARBECUE" },
      ],
    });

    const withOne = await createAvailableProperty(brokerId, {
      internalTitle: "B",
      publicTitle: "Só piscina",
    });
    await prisma.propertyFeature.create({ data: { propertyId: withOne.id, featureType: "POOL" } });

    const catalog = await getPublicCatalog(
      slug,
      parseCatalogFilters({ features: ["POOL", "BARBECUE"] }),
    );
    expect(catalog!.properties.map((p) => p.title)).toEqual(["Com piscina e churrasqueira"]);
  });

  it("ordena por menor preço e por maior preço", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-sort");

    await createAvailableProperty(brokerId, {
      internalTitle: "A",
      publicTitle: "Médio",
      price: "500000",
    });
    await createAvailableProperty(brokerId, {
      internalTitle: "B",
      publicTitle: "Barato",
      price: "100000",
    });
    await createAvailableProperty(brokerId, {
      internalTitle: "C",
      publicTitle: "Caro",
      price: "900000",
    });

    const asc = await getPublicCatalog(slug, parseCatalogFilters({ sort: "price_asc" }));
    expect(asc!.properties.map((p) => p.title)).toEqual(["Barato", "Médio", "Caro"]);

    const desc = await getPublicCatalog(slug, parseCatalogFilters({ sort: "price_desc" }));
    expect(desc!.properties.map((p) => p.title)).toEqual(["Caro", "Médio", "Barato"]);
  });

  it("pagina os resultados", async () => {
    const { brokerId, slug } = await createPublishedBroker("catalog-pagination");

    for (let i = 0; i < 14; i += 1) {
      await createAvailableProperty(brokerId, {
        internalTitle: `Imóvel ${i}`,
        publicTitle: `Imóvel ${i}`,
      });
    }

    const firstPage = await getPublicCatalog(slug, parseCatalogFilters({}));
    expect(firstPage!.total).toBe(14);
    expect(firstPage!.properties).toHaveLength(12);
    expect(firstPage!.totalPages).toBe(2);

    const secondPage = await getPublicCatalog(slug, parseCatalogFilters({ page: "2" }));
    expect(secondPage!.properties).toHaveLength(2);
  });
});

describe("getPublicProperty (RN-032, RN-039, RN-040, RN-046, RN-049, RN-053)", () => {
  it("retorna null para corretor inexistente, catálogo desativado ou imóvel inexistente", async () => {
    const { brokerId, slug } = await createPublishedBroker("property-page-missing");
    const property = await createAvailableProperty(brokerId, {
      internalTitle: "A",
      publicTitle: "Imóvel existente",
    });

    expect(await getPublicProperty("slug-que-nunca-existiu", property.slug!)).toBeNull();
    expect(await getPublicProperty(slug, "slug-de-imovel-que-nunca-existiu")).toBeNull();
  });

  it("retorna null para imóvel despublicado (RN-032, RN-054)", async () => {
    const { brokerId, slug } = await createPublishedBroker("property-page-unpublished");
    const property = await createAvailableProperty(brokerId, {
      internalTitle: "A",
      publicTitle: "Imóvel a despublicar",
    });

    await changePropertyStatus(property.id, brokerId, "INACTIVE");

    expect(await getPublicProperty(slug, property.slug!)).toBeNull();
  });

  it("retorna null para rascunho (nunca publicado)", async () => {
    const { brokerId, slug } = await createPublishedBroker("property-page-draft");
    const draft = await createDraftProperty(brokerId);

    expect(await getPublicProperty(slug, draft.slug!)).toBeNull();
  });

  it("nunca expõe campos internos, mas inclui o código de referência (RN-049, RN-051)", async () => {
    const { brokerId, slug } = await createPublishedBroker("property-page-internal-fields");
    const property = await createAvailableProperty(brokerId, {
      internalTitle: "Anotação interna secreta do corretor",
      publicTitle: "Imóvel público",
      referenceCode: "REF-XYZ-001",
    });

    const result = await getPublicProperty(slug, property.slug!);
    expect(result!.property.referenceCode).toBe("REF-XYZ-001");
    expect(result!.property).not.toHaveProperty("internalTitle");
    expect(result!.property).not.toHaveProperty("internalNotes");
    expect(JSON.stringify(result!.property)).not.toContain("Anotação interna secreta");
  });

  it("mostra endereço completo apenas quando a visibilidade é FULL_ADDRESS (RN-039, RN-040)", async () => {
    const { brokerId, slug } = await createPublishedBroker("property-page-address");

    const hidden = await createAvailableProperty(
      brokerId,
      { internalTitle: "A", publicTitle: "Endereço oculto" },
      { street: "Rua das Flores", number: "123", visibilityType: "HIDDEN_EXACT" },
    );
    const full = await createAvailableProperty(
      brokerId,
      { internalTitle: "B", publicTitle: "Endereço completo" },
      { street: "Rua das Flores", number: "456", visibilityType: "FULL_ADDRESS" },
    );

    const hiddenResult = await getPublicProperty(slug, hidden.slug!);
    expect(hiddenResult!.property.address?.street).toBeNull();
    expect(hiddenResult!.property.address?.city).not.toBeNull();

    const fullResult = await getPublicProperty(slug, full.slug!);
    expect(fullResult!.property.address?.street).toBe("Rua das Flores");
    expect(fullResult!.property.address?.number).toBe("456");
  });

  it("lista imóveis semelhantes restritos ao mesmo corretor e disponíveis (RN-053)", async () => {
    const brokerA = await createPublishedBroker("property-page-similar-a");
    const brokerB = await createPublishedBroker("property-page-similar-b");

    const main = await createAvailableProperty(brokerA.brokerId, {
      internalTitle: "A",
      publicTitle: "Casa principal",
      purpose: "SALE",
      propertyType: "HOUSE",
    });
    const sameTypeSameBroker = await createAvailableProperty(brokerA.brokerId, {
      internalTitle: "B",
      publicTitle: "Casa semelhante",
      purpose: "SALE",
      propertyType: "HOUSE",
    });
    await createAvailableProperty(brokerB.brokerId, {
      internalTitle: "C",
      publicTitle: "Casa de outro corretor",
      purpose: "SALE",
      propertyType: "HOUSE",
    });
    const unpublished = await createAvailableProperty(brokerA.brokerId, {
      internalTitle: "D",
      publicTitle: "Casa despublicada",
      purpose: "SALE",
      propertyType: "HOUSE",
    });
    await changePropertyStatus(unpublished.id, brokerA.brokerId, "INACTIVE");

    const result = await getPublicProperty(brokerA.slug, main.slug!);
    const similarTitles = result!.similar.map((p) => p.title);

    expect(similarTitles).toContain("Casa semelhante");
    expect(similarTitles).not.toContain("Casa de outro corretor");
    expect(similarTitles).not.toContain("Casa despublicada");
    expect(similarTitles).not.toContain("Casa principal");
    expect(result!.similar.some((p) => p.id === sameTypeSameBroker.id)).toBe(true);
  });
});
