import {
  brokerProfileRepository,
  type BrokerProfileWriteInput,
} from "@/server/repositories/broker-profile-repository";
import type { BrokerProfileInput } from "@/lib/validation/broker-profile";
import { getPublicationRequirementErrors } from "@/lib/validation/broker-profile";
import { generateStorageKey, getStorageProvider } from "@/lib/storage";
import { processImage, UnsupportedImageFormatError } from "@/lib/image/process-image";
import { logger } from "@/lib/observability/logger";
import { Prisma, type BrokerProfile } from "@/generated/prisma/client";

export class SlugTakenError extends Error {
  constructor() {
    super("Este slug já está em uso por outro corretor.");
    this.name = "SlugTakenError";
  }
}

export class PublicationRequirementsError extends Error {
  constructor(public readonly reasons: string[]) {
    super("Perfil incompleto para publicação do catálogo.");
    this.name = "PublicationRequirementsError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Salve as informações do seu perfil antes de enviar uma foto ou logotipo.");
    this.name = "ProfileNotFoundError";
  }
}

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const PHOTO_DIMENSIONS = { maxWidth: 800, maxHeight: 800 };
const LOGO_DIMENSIONS = { maxWidth: 600, maxHeight: 600 };

export class UploadTooLargeError extends Error {
  constructor() {
    super("Arquivo maior que o limite permitido (5 MB).");
    this.name = "UploadTooLargeError";
  }
}

function normalizeForStorage(input: BrokerProfileInput): BrokerProfileWriteInput {
  return {
    professionalName: input.professionalName,
    fullName: input.fullName,
    slug: input.slug,
    creciNumber: input.creciNumber ?? null,
    creciState: input.creciState ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? null,
    commercialEmail: input.commercialEmail ?? null,
    biography: input.biography ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    businessAddress: input.businessAddress ?? null,
    instagramUrl: input.instagramUrl ?? null,
    facebookUrl: input.facebookUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    websiteUrl: input.websiteUrl ?? null,
    primaryColor: input.primaryColor ?? null,
    secondaryColor: input.secondaryColor ?? null,
    photoUrl: null,
    logoUrl: null,
  };
}

export async function getOwnProfile(userId: string): Promise<BrokerProfile | null> {
  return brokerProfileRepository.findByUserId(userId);
}

/**
 * RN-022: catálogo inativo nunca é retornado como público, mesmo que o
 * slug exista.
 */
export async function getPublicProfileBySlug(slug: string): Promise<BrokerProfile | null> {
  const profile = await brokerProfileRepository.findBySlug(slug);
  if (!profile || !profile.catalogEnabled) {
    return null;
  }
  return profile;
}

/**
 * Cria ou atualiza o perfil do corretor autenticado (RN-015, RN-019 a
 * RN-023, RN-025). userId sempre vem da sessão — nunca do cliente.
 */
export async function saveOwnProfile(
  userId: string,
  input: BrokerProfileInput,
): Promise<BrokerProfile> {
  const slugTaken = await brokerProfileRepository.isSlugTaken(input.slug, userId);
  if (slugTaken) {
    throw new SlugTakenError();
  }

  const existing = await brokerProfileRepository.findByUserId(userId);
  const data = normalizeForStorage(input);

  // Preserva foto/logo já enviados — este fluxo não os altera.
  if (existing) {
    data.photoUrl = existing.photoUrl;
    data.logoUrl = existing.logoUrl;
  }

  try {
    return await brokerProfileRepository.upsertByUserId(userId, data);
  } catch (error) {
    // Defesa contra corrida entre a verificação acima e a escrita: dois
    // corretores salvando o mesmo slug ao mesmo tempo. A constraint
    // @unique do banco garante a integridade; aqui só traduzimos o erro
    // bruto do Postgres em uma mensagem amigável (RN-019).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SlugTakenError();
    }
    throw error;
  }
}

export async function checkSlugAvailability(slug: string, userId: string): Promise<boolean> {
  const taken = await brokerProfileRepository.isSlugTaken(slug, userId);
  return !taken;
}

/**
 * RN-016 a RN-018: só permite publicar o catálogo quando os campos
 * mínimos estão preenchidos.
 */
export async function setCatalogEnabled(userId: string, enabled: boolean): Promise<BrokerProfile> {
  if (!enabled) {
    return brokerProfileRepository.setCatalogEnabled(userId, false);
  }

  const profile = await brokerProfileRepository.findByUserId(userId);
  if (!profile) {
    throw new PublicationRequirementsError(["Complete seu perfil antes de publicar o catálogo."]);
  }

  const reasons = getPublicationRequirementErrors(profile);
  if (reasons.length > 0) {
    throw new PublicationRequirementsError(reasons);
  }

  return brokerProfileRepository.setCatalogEnabled(userId, true);
}

async function uploadBrokerImage(
  userId: string,
  file: File,
  kind: "photo" | "logo",
): Promise<string> {
  const previous = await brokerProfileRepository.findByUserId(userId);
  if (!previous) {
    throw new ProfileNotFoundError();
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadTooLargeError();
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const dimensions = kind === "photo" ? PHOTO_DIMENSIONS : LOGO_DIMENSIONS;
  const processed = await processImage(inputBuffer, dimensions);

  const key = generateStorageKey(`broker/${userId}/${kind}`, "jpg");
  const storage = getStorageProvider();
  const uploaded = await storage.upload({
    key,
    body: processed.buffer,
    contentType: processed.contentType,
  });

  const previousUrl = kind === "photo" ? previous.photoUrl : previous.logoUrl;

  if (kind === "photo") {
    await brokerProfileRepository.updatePhotoUrl(userId, uploaded.publicUrl);
  } else {
    await brokerProfileRepository.updateLogoUrl(userId, uploaded.publicUrl);
  }

  if (previousUrl) {
    await deleteStoredImageBestEffort(previousUrl, uploaded.publicUrl);
  }

  return uploaded.publicUrl;
}

async function deleteStoredImageBestEffort(previousUrl: string, newUrl: string): Promise<void> {
  if (previousUrl === newUrl) return;
  try {
    const storage = getStorageProvider();
    await storage.delete(storage.keyFromPublicUrl(previousUrl));
  } catch (error) {
    logger.warn("Falha ao remover imagem antiga do storage (não bloqueia a operação)", {
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  return uploadBrokerImage(userId, file, "photo");
}

export async function uploadProfileLogo(userId: string, file: File): Promise<string> {
  return uploadBrokerImage(userId, file, "logo");
}

export { UnsupportedImageFormatError };
