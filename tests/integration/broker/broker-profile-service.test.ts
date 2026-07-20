import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import {
  PublicationRequirementsError,
  SlugTakenError,
  checkSlugAvailability,
  getOwnProfile,
  getPublicProfileBySlug,
  saveOwnProfile,
  setCatalogEnabled,
} from "@/server/services/broker-profile-service";
import { brokerProfileSchema } from "@/lib/validation/broker-profile";

const testEmails: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  return email;
}

async function createUser(label: string): Promise<string> {
  const email = uniqueEmail(label);
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

function buildInput(
  overrides: Partial<ReturnType<typeof brokerProfileSchema.parse>> & { slug: string },
) {
  return brokerProfileSchema.parse({
    professionalName: "Maria Silva Imóveis",
    fullName: "Maria da Silva",
    ...overrides,
  });
}

describe("saveOwnProfile", () => {
  it("cria o perfil na primeira chamada e atualiza nas seguintes (upsert)", async () => {
    const userId = await createUser("broker-save");
    const slug = `broker-save-${Date.now()}`;

    const created = await saveOwnProfile(userId, buildInput({ slug, city: "" }));
    expect(created.professionalName).toBe("Maria Silva Imóveis");
    expect(created.catalogEnabled).toBe(false);

    const updated = await saveOwnProfile(
      userId,
      buildInput({ slug, city: "Campinas", professionalName: "Maria Silva Corretora" }),
    );
    expect(updated.id).toBe(created.id);
    expect(updated.city).toBe("Campinas");
    expect(updated.professionalName).toBe("Maria Silva Corretora");

    const count = await prisma.brokerProfile.count({ where: { userId } });
    expect(count).toBe(1); // RN-025: um único perfil por conta
  });

  it("rejeita slug já usado por outro corretor (RN-019)", async () => {
    const userIdA = await createUser("broker-slug-a");
    const userIdB = await createUser("broker-slug-b");
    const slug = `slug-disputado-${Date.now()}`;

    await saveOwnProfile(userIdA, buildInput({ slug }));

    await expect(saveOwnProfile(userIdB, buildInput({ slug }))).rejects.toThrow(SlugTakenError);
  });

  it("permite ao próprio dono salvar novamente usando o mesmo slug", async () => {
    const userId = await createUser("broker-same-slug");
    const slug = `broker-same-slug-${Date.now()}`;

    await saveOwnProfile(userId, buildInput({ slug }));
    await expect(
      saveOwnProfile(userId, buildInput({ slug, city: "Recife" })),
    ).resolves.toBeTruthy();
  });
});

describe("Isolamento entre corretores (RN-023)", () => {
  it("cada corretor só enxerga o próprio perfil via getOwnProfile", async () => {
    const userIdA = await createUser("broker-iso-a");
    const userIdB = await createUser("broker-iso-b");

    await saveOwnProfile(userIdA, buildInput({ slug: `broker-iso-a-${Date.now()}` }));

    const profileA = await getOwnProfile(userIdA);
    const profileB = await getOwnProfile(userIdB);

    expect(profileA).not.toBeNull();
    expect(profileB).toBeNull();
    expect(profileA?.userId).toBe(userIdA);
  });
});

describe("setCatalogEnabled (RN-016 a RN-018, RN-022)", () => {
  it("bloqueia a publicação quando faltam CRECI, WhatsApp ou cidade", async () => {
    const userId = await createUser("broker-pub-block");
    await saveOwnProfile(userId, buildInput({ slug: `broker-pub-block-${Date.now()}`, city: "" }));

    await expect(setCatalogEnabled(userId, true)).rejects.toThrow(PublicationRequirementsError);
  });

  it("publica quando todos os campos obrigatórios estão presentes", async () => {
    const userId = await createUser("broker-pub-ok");
    const slug = `broker-pub-ok-${Date.now()}`;

    await saveOwnProfile(
      userId,
      buildInput({
        slug,
        creciNumber: "12345",
        creciState: "SP",
        whatsapp: "11999999999",
        city: "São Paulo",
      }),
    );

    const enabled = await setCatalogEnabled(userId, true);
    expect(enabled.catalogEnabled).toBe(true);

    const publicProfile = await getPublicProfileBySlug(slug);
    expect(publicProfile).not.toBeNull();

    const disabled = await setCatalogEnabled(userId, false);
    expect(disabled.catalogEnabled).toBe(false);

    const publicProfileAfterDisable = await getPublicProfileBySlug(slug);
    expect(publicProfileAfterDisable).toBeNull();
  });
});

describe("getPublicProfileBySlug (RN-022)", () => {
  it("retorna null para slug inexistente", async () => {
    expect(await getPublicProfileBySlug("slug-que-nunca-existiu-em-lugar-nenhum")).toBeNull();
  });

  it("retorna null para perfil existente porém com catálogo desativado", async () => {
    const userId = await createUser("broker-inactive");
    const slug = `broker-inactive-${Date.now()}`;
    await saveOwnProfile(userId, buildInput({ slug }));

    expect(await getPublicProfileBySlug(slug)).toBeNull();
  });
});

describe("checkSlugAvailability", () => {
  it("considera o próprio slug do corretor como disponível para ele mesmo", async () => {
    const userId = await createUser("broker-check-own");
    const slug = `broker-check-own-${Date.now()}`;
    await saveOwnProfile(userId, buildInput({ slug }));

    expect(await checkSlugAvailability(slug, userId)).toBe(true);
  });

  it("considera indisponível para outro corretor", async () => {
    const userIdA = await createUser("broker-check-a");
    const userIdB = await createUser("broker-check-b");
    const slug = `broker-check-${Date.now()}`;
    await saveOwnProfile(userIdA, buildInput({ slug }));

    expect(await checkSlugAvailability(slug, userIdB)).toBe(false);
  });
});
