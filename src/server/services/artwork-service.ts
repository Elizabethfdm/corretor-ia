import { artworkRepository } from "@/server/repositories/artwork-repository";
import { getOwnProperty } from "@/server/services/property-service";
import { generateStorageKey, getStorageProvider } from "@/lib/storage";
import { ArtworkRenderError, composeArtwork } from "@/lib/artwork/compose-artwork";
import type { GenerateArtworkInput } from "@/lib/validation/artwork";
import type { BrokerProfile } from "@/generated/prisma/client";

export { ArtworkRenderError } from "@/lib/artwork/compose-artwork";

export class ArtworkPhotoNotFoundError extends Error {
  constructor() {
    super("Selecione uma foto válida deste imóvel.");
    this.name = "ArtworkPhotoNotFoundError";
  }
}

export class ArtworkNotFoundError extends Error {
  constructor() {
    super("Arte não encontrada.");
    this.name = "ArtworkNotFoundError";
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ArtworkRenderError("Não foi possível carregar a foto selecionada.");
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** RN-076: logotipo ausente/indisponível não impede a geração (best effort). */
async function fetchLogoBufferBestEffort(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    return await fetchImageBuffer(url);
  } catch {
    return null;
  }
}

/** Histórico de artes de um imóvel, isolado por corretor (RN-026). */
export async function listArtworkForProperty(propertyId: string, brokerId: string) {
  await getOwnProperty(propertyId, brokerId);
  return artworkRepository.findManyByProperty(propertyId, brokerId);
}

/**
 * RN-075 a RN-081: gera uma arte a partir da foto escolhida e dos
 * modelos fixos definidos no código (ADR-0006). Só é persistida se a
 * composição e o upload tiverem sucesso.
 */
export async function generateArtwork(broker: BrokerProfile, input: GenerateArtworkInput) {
  const property = await getOwnProperty(input.propertyId, broker.id);

  const photo = property.media.find((media) => media.id === input.photoMediaId);
  if (!photo) {
    throw new ArtworkPhotoNotFoundError();
  }

  const [photoBuffer, logoBuffer] = await Promise.all([
    fetchImageBuffer(photo.publicUrl),
    fetchLogoBufferBestEffort(broker.logoUrl),
  ]);

  const composed = await composeArtwork({
    format: input.format,
    templateType: input.templateType,
    photoBuffer,
    title: input.title,
    subtitle: input.subtitle,
    callToAction: input.callToAction,
    accentColor: broker.primaryColor,
    logoBuffer,
  });

  const storageProvider = getStorageProvider();
  const key = generateStorageKey(`artwork/${property.id}`, "jpg");
  const stored = await storageProvider.upload({
    key,
    body: composed.buffer,
    contentType: composed.contentType,
  });

  return artworkRepository.create({
    broker: { connect: { id: broker.id } },
    property: { connect: { id: property.id } },
    photoMedia: { connect: { id: photo.id } },
    format: input.format,
    templateType: input.templateType,
    title: input.title,
    subtitle: input.subtitle,
    callToAction: input.callToAction,
    outputKey: stored.key,
    outputUrl: stored.publicUrl,
    width: composed.width,
    height: composed.height,
  });
}

/** RN-026: verifica posse antes de permitir o download. */
export async function getArtworkForDownload(id: string, brokerId: string) {
  const artwork = await artworkRepository.findByIdForBroker(id, brokerId);
  if (!artwork) {
    throw new ArtworkNotFoundError();
  }
  return artwork;
}
