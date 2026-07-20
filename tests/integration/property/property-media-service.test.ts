import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";
import { saveOwnProfile } from "@/server/services/broker-profile-service";
import { createDraftProperty, getOwnProperty } from "@/server/services/property-service";
import {
  MediaNotFoundError,
  UnsupportedImageFormatError,
  deletePropertyPhoto,
  movePropertyPhoto,
  setCoverPhoto,
  uploadPropertyPhotos,
} from "@/server/services/property-media-service";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function pngFile(name = "photo.png"): File {
  return new File([VALID_PNG], name, { type: "image/png" });
}

const testEmails: string[] = [];

async function createBrokerWithDraftProperty(label: string) {
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
  const property = await createDraftProperty(profile.id);
  return { brokerId: profile.id, propertyId: property.id };
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

describe("uploadPropertyPhotos (RN-033 a RN-037)", () => {
  it("processa e envia fotos, marcando a primeira como capa (RN-034)", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-upload");

    const created = await uploadPropertyPhotos(propertyId, brokerId, [
      pngFile("first.png"),
      pngFile("second.png"),
    ]);

    expect(created).toHaveLength(2);
    expect(created[0]?.isCover).toBe(true);
    expect(created[1]?.isCover).toBe(false);
    expect(created[0]?.mimeType).toBe("image/jpeg");

    const response = await fetch(created[0]!.publicUrl);
    expect(response.status).toBe(200);

    const property = await getOwnProperty(propertyId, brokerId);
    expect(property.media).toHaveLength(2);
  });

  it("não marca capa novamente quando o imóvel já tem uma foto de capa", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-cover-keep");

    await uploadPropertyPhotos(propertyId, brokerId, [pngFile("first.png")]);
    const second = await uploadPropertyPhotos(propertyId, brokerId, [pngFile("second.png")]);

    expect(second[0]?.isCover).toBe(false);
  });

  it("rejeita arquivo que não é uma imagem válida", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-invalid");

    const fakeFile = new File([Buffer.from("nao-e-uma-imagem")], "fake.png", {
      type: "image/png",
    });

    await expect(uploadPropertyPhotos(propertyId, brokerId, [fakeFile])).rejects.toThrow(
      UnsupportedImageFormatError,
    );
  });
});

describe("deletePropertyPhoto (RN-045)", () => {
  it("remove a foto e promove a próxima como capa quando a capa é excluída", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-delete");

    const [first, second] = await uploadPropertyPhotos(propertyId, brokerId, [
      pngFile("first.png"),
      pngFile("second.png"),
    ]);

    await deletePropertyPhoto(propertyId, brokerId, first!.id);

    const property = await getOwnProperty(propertyId, brokerId);
    expect(property.media).toHaveLength(1);
    expect(property.media[0]?.id).toBe(second!.id);
    expect(property.media[0]?.isCover).toBe(true);

    const deletedResponse = await fetch(first!.publicUrl);
    expect(deletedResponse.status).toBe(404);
  });

  it("lança MediaNotFoundError para foto inexistente ou já excluída", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-delete-missing");

    await expect(
      deletePropertyPhoto(propertyId, brokerId, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow(MediaNotFoundError);
  });
});

describe("setCoverPhoto (RN-034)", () => {
  it("troca a foto de capa", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-set-cover");

    const [first, second] = await uploadPropertyPhotos(propertyId, brokerId, [
      pngFile("first.png"),
      pngFile("second.png"),
    ]);

    await setCoverPhoto(propertyId, brokerId, second!.id);

    const property = await getOwnProperty(propertyId, brokerId);
    const updatedFirst = property.media.find((m) => m.id === first!.id);
    const updatedSecond = property.media.find((m) => m.id === second!.id);
    expect(updatedFirst?.isCover).toBe(false);
    expect(updatedSecond?.isCover).toBe(true);
  });
});

describe("movePropertyPhoto (RN-045)", () => {
  it("troca a ordem de exibição entre fotos adjacentes", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-move");

    const [first, second, third] = await uploadPropertyPhotos(propertyId, brokerId, [
      pngFile("first.png"),
      pngFile("second.png"),
      pngFile("third.png"),
    ]);

    await movePropertyPhoto(propertyId, brokerId, third!.id, "up");

    const property = await getOwnProperty(propertyId, brokerId);
    const ordered = [...property.media].sort((a, b) => a.displayOrder - b.displayOrder);
    expect(ordered.map((m) => m.id)).toEqual([first!.id, third!.id, second!.id]);
  });

  it("não faz nada ao mover a primeira foto para cima ou a última para baixo", async () => {
    const { brokerId, propertyId } = await createBrokerWithDraftProperty("media-move-boundary");

    const [first, second] = await uploadPropertyPhotos(propertyId, brokerId, [
      pngFile("first.png"),
      pngFile("second.png"),
    ]);

    await expect(movePropertyPhoto(propertyId, brokerId, first!.id, "up")).resolves.toBeUndefined();
    await expect(
      movePropertyPhoto(propertyId, brokerId, second!.id, "down"),
    ).resolves.toBeUndefined();

    const property = await getOwnProperty(propertyId, brokerId);
    const ordered = [...property.media].sort((a, b) => a.displayOrder - b.displayOrder);
    expect(ordered.map((m) => m.id)).toEqual([first!.id, second!.id]);
  });
});

describe("Isolamento entre corretores (RN-026)", () => {
  it("um corretor não pode enviar foto para imóvel de outro corretor", async () => {
    const { propertyId } = await createBrokerWithDraftProperty("media-iso-owner");
    const { brokerId: otherBrokerId } = await createBrokerWithDraftProperty("media-iso-other");

    await expect(
      uploadPropertyPhotos(propertyId, otherBrokerId, [pngFile()]),
    ).rejects.toThrow();
  });
});
