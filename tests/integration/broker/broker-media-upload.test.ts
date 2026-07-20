import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import {
  UnsupportedImageFormatError,
  saveOwnProfile,
  uploadProfileLogo,
  uploadProfilePhoto,
} from "@/server/services/broker-profile-service";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function pngFile(name = "photo.png"): File {
  return new File([VALID_PNG], name, { type: "image/png" });
}

const testEmails: string[] = [];

async function createUser(label: string): Promise<string> {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  const result = await auth.api.signUpEmail({
    body: { name: label, email, password: "senha1234" },
  });
  return result.user.id;
}

afterEach(async () => {
  if (testEmails.length > 0) {
    // broker_profile não tem FK/cascade com user (ver data-model.md),
    // então precisa ser limpo explicitamente antes do usuário.
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

describe("uploadProfilePhoto / uploadProfileLogo (RN-021, RN-024, RN-035)", () => {
  it("processa, envia a foto e grava a URL pública no perfil", async () => {
    const userId = await createUser("broker-photo");
    await saveOwnProfile(
      userId,
      brokerProfileSchema.parse({
        professionalName: "Maria Silva",
        fullName: "Maria da Silva",
        slug: `broker-photo-${Date.now()}`,
      }),
    );

    const url = await uploadProfilePhoto(userId, pngFile());
    expect(url).toMatch(/^http/);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");

    const profile = await prisma.brokerProfile.findUnique({ where: { userId } });
    expect(profile?.photoUrl).toBe(url);
  });

  it("substitui a foto anterior e remove o arquivo antigo do storage", async () => {
    const userId = await createUser("broker-photo-replace");
    await saveOwnProfile(
      userId,
      brokerProfileSchema.parse({
        professionalName: "Maria Silva",
        fullName: "Maria da Silva",
        slug: `broker-photo-replace-${Date.now()}`,
      }),
    );

    const firstUrl = await uploadProfilePhoto(userId, pngFile("first.png"));
    const secondUrl = await uploadProfilePhoto(userId, pngFile("second.png"));

    expect(secondUrl).not.toBe(firstUrl);

    const oldResponse = await fetch(firstUrl);
    expect(oldResponse.status).toBe(404);

    const newResponse = await fetch(secondUrl);
    expect(newResponse.status).toBe(200);
  });

  it("faz upload do logotipo de forma independente da foto", async () => {
    const userId = await createUser("broker-logo");
    await saveOwnProfile(
      userId,
      brokerProfileSchema.parse({
        professionalName: "Maria Silva",
        fullName: "Maria da Silva",
        slug: `broker-logo-${Date.now()}`,
      }),
    );

    const logoUrl = await uploadProfileLogo(userId, pngFile("logo.png"));

    const profile = await prisma.brokerProfile.findUnique({ where: { userId } });
    expect(profile?.logoUrl).toBe(logoUrl);
    expect(profile?.photoUrl).toBeNull();
  });

  it("rejeita arquivo que não é uma imagem válida", async () => {
    const userId = await createUser("broker-photo-invalid");
    await saveOwnProfile(
      userId,
      brokerProfileSchema.parse({
        professionalName: "Maria Silva",
        fullName: "Maria da Silva",
        slug: `broker-photo-invalid-${Date.now()}`,
      }),
    );

    const fakeFile = new File([Buffer.from("nao-e-uma-imagem")], "fake.png", {
      type: "image/png",
    });

    await expect(uploadProfilePhoto(userId, fakeFile)).rejects.toThrow(UnsupportedImageFormatError);
  });
});
