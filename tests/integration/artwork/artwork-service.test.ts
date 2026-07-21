import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { saveOwnProfile, uploadProfileLogo } from "@/server/services/broker-profile-service";
import {
  createDraftProperty,
  PropertyNotFoundError,
  saveBasicInfo,
  saveLocation,
} from "@/server/services/property-service";
import { uploadPropertyPhotos } from "@/server/services/property-media-service";
import {
  ArtworkNotFoundError,
  ArtworkPhotoNotFoundError,
  generateArtwork,
  getArtworkForDownload,
  listArtworkForProperty,
} from "@/server/services/artwork-service";
import type { GenerateArtworkInput } from "@/lib/validation/artwork";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function pngFile(name = "photo.png"): File {
  return new File([VALID_PNG], name, { type: "image/png" });
}

const testEmails: string[] = [];

async function createBrokerProfileAndProperty(label: string) {
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
    internalTitle: "Anotação interna do corretor — nunca deve ir para a arte",
    purpose: "SALE",
    propertyType: "HOUSE",
    price: "450000",
    showPrice: true,
    featured: false,
  });
  await saveLocation(property.id, broker.id, {
    city: "São Paulo",
    neighborhood: "Jardim Europa",
    visibilityType: "HIDDEN_EXACT",
  });

  const [photo] = await uploadPropertyPhotos(property.id, broker.id, [pngFile()]);

  return { broker, propertyId: property.id, photoMediaId: photo!.id };
}

function buildInput(
  propertyId: string,
  photoMediaId: string,
  overrides: Partial<GenerateArtworkInput> = {},
): GenerateArtworkInput {
  return {
    propertyId,
    photoMediaId,
    format: "SQUARE_FEED",
    templateType: "NEW_PROPERTY",
    title: "Casa nova no Jardim Europa",
    subtitle: "3 quartos · R$ 450.000,00",
    callToAction: "Fale comigo e agende uma visita",
    ...overrides,
  } as GenerateArtworkInput;
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
}, 30_000);

describe("generateArtwork (RN-075 a RN-081)", () => {
  it(
    "gera e persiste uma arte a partir da foto escolhida",
    async () => {
      const { broker, propertyId, photoMediaId } =
        await createBrokerProfileAndProperty("art-generate");

      const artwork = await generateArtwork(broker, buildInput(propertyId, photoMediaId));

      expect(artwork.format).toBe("SQUARE_FEED");
      expect(artwork.templateType).toBe("NEW_PROPERTY");
      expect(artwork.title).toBe("Casa nova no Jardim Europa");
      expect(artwork.outputUrl).toBeTruthy();
      expect(artwork.width).toBeGreaterThan(0);
      expect(artwork.height).toBeGreaterThan(0);
    },
    30_000,
  );

  it(
    "aplica a identidade visual do corretor quando o logotipo está configurado (RN-076)",
    async () => {
      const { broker, propertyId, photoMediaId } =
        await createBrokerProfileAndProperty("art-logo");

      await uploadProfileLogo(broker.userId, pngFile("logo.png"));
      const brokerWithLogo = await prisma.brokerProfile.findUniqueOrThrow({
        where: { id: broker.id },
      });
      expect(brokerWithLogo.logoUrl).toBeTruthy();

      await expect(
        generateArtwork(brokerWithLogo, buildInput(propertyId, photoMediaId)),
      ).resolves.toBeTruthy();
    },
    30_000,
  );

  it(
    "lança PropertyNotFoundError para imóvel de outro corretor (RN-026)",
    async () => {
      const { propertyId, photoMediaId } = await createBrokerProfileAndProperty("art-iso-owner");
      const { broker: otherBroker } = await createBrokerProfileAndProperty("art-iso-other");

      await expect(
        generateArtwork(otherBroker, buildInput(propertyId, photoMediaId)),
      ).rejects.toThrow(PropertyNotFoundError);
    },
    30_000,
  );

  it(
    "lança ArtworkPhotoNotFoundError para foto de outro imóvel (RN-026)",
    async () => {
      const { broker, propertyId } = await createBrokerProfileAndProperty("art-photo-owner");
      const { photoMediaId: otherPhotoId } = await createBrokerProfileAndProperty("art-photo-other");

      await expect(
        generateArtwork(broker, buildInput(propertyId, otherPhotoId)),
      ).rejects.toThrow(ArtworkPhotoNotFoundError);
    },
    30_000,
  );
});

describe("listArtworkForProperty (RN-026)", () => {
  it(
    "retorna o histórico em ordem decrescente, isolado por corretor",
    async () => {
      const { broker, propertyId, photoMediaId } = await createBrokerProfileAndProperty("art-history");
      const { broker: otherBroker } = await createBrokerProfileAndProperty("art-history-other");

      await generateArtwork(broker, buildInput(propertyId, photoMediaId, { templateType: "HIGHLIGHT" }));
      await generateArtwork(broker, buildInput(propertyId, photoMediaId, { templateType: "SALE" }));

      const history = await listArtworkForProperty(propertyId, broker.id);
      expect(history).toHaveLength(2);
      expect(history[0]!.templateType).toBe("SALE");
      expect(history[1]!.templateType).toBe("HIGHLIGHT");

      await expect(listArtworkForProperty(propertyId, otherBroker.id)).rejects.toThrow(
        PropertyNotFoundError,
      );
    },
    30_000,
  );
});

describe("getArtworkForDownload (RF-065, RN-026)", () => {
  it(
    "só permite o download ao corretor dono da arte",
    async () => {
      const { broker, propertyId, photoMediaId } = await createBrokerProfileAndProperty("art-download");
      const { broker: otherBroker } = await createBrokerProfileAndProperty("art-download-other");
      const artwork = await generateArtwork(broker, buildInput(propertyId, photoMediaId));

      await expect(getArtworkForDownload(artwork.id, broker.id)).resolves.toMatchObject({
        id: artwork.id,
      });
      await expect(getArtworkForDownload(artwork.id, otherBroker.id)).rejects.toThrow(
        ArtworkNotFoundError,
      );
    },
    30_000,
  );
});

