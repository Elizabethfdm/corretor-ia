import { propertyMediaRepository } from "@/server/repositories/property-media-repository";
import { getOwnProperty } from "@/server/services/property-service";
import { generateStorageKey, getStorageProvider } from "@/lib/storage";
import { processImage, UnsupportedImageFormatError } from "@/lib/image/process-image";
import { logger } from "@/lib/observability/logger";
import type { PropertyMedia } from "@/generated/prisma/client";

export { UnsupportedImageFormatError };

export class TooManyPhotosError extends Error {
  constructor() {
    super(`É permitido enviar no máximo ${MAX_PHOTOS_PER_PROPERTY} fotos por imóvel.`);
    this.name = "TooManyPhotosError";
  }
}

export class UploadTooLargeError extends Error {
  constructor() {
    super("Arquivo maior que o limite permitido (8 MB).");
    this.name = "UploadTooLargeError";
  }
}

export class MediaNotFoundError extends Error {
  constructor() {
    super("Foto não encontrada.");
    this.name = "MediaNotFoundError";
  }
}

const MAX_PHOTOS_PER_PROPERTY = 30;
const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const PHOTO_DIMENSIONS = { maxWidth: 1600, maxHeight: 1600 };

/**
 * RN-033/RN-034/RN-035/RN-036/RN-037: envia uma ou mais fotos, validando
 * conteúdo real, comprimindo e removendo metadados. A primeira foto
 * enviada para o imóvel vira capa automaticamente.
 */
export async function uploadPropertyPhotos(
  propertyId: string,
  brokerId: string,
  files: File[],
): Promise<PropertyMedia[]> {
  await getOwnProperty(propertyId, brokerId);

  const existing = await propertyMediaRepository.findActiveByProperty(propertyId);
  if (existing.length + files.length > MAX_PHOTOS_PER_PROPERTY) {
    throw new TooManyPhotosError();
  }

  const hasCover = existing.some((m) => m.isCover);
  let nextDisplayOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.displayOrder)) + 1 : 0;
  const storage = getStorageProvider();
  const created: PropertyMedia[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new UploadTooLargeError();
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(inputBuffer, PHOTO_DIMENSIONS);

    const key = generateStorageKey(`property/${propertyId}/photo`, "jpg");
    const uploaded = await storage.upload({
      key,
      body: processed.buffer,
      contentType: processed.contentType,
    });

    const media = await propertyMediaRepository.create({
      propertyId,
      storageKey: key,
      publicUrl: uploaded.publicUrl,
      mimeType: processed.contentType,
      size: processed.buffer.length,
      width: processed.width,
      height: processed.height,
      displayOrder: nextDisplayOrder,
      isCover: !hasCover && index === 0,
    });

    created.push(media);
    nextDisplayOrder += 1;
  }

  return created;
}

/** RN-045: remove uma foto; promove a próxima como capa quando necessário. */
export async function deletePropertyPhoto(
  propertyId: string,
  brokerId: string,
  mediaId: string,
): Promise<void> {
  await getOwnProperty(propertyId, brokerId);

  const media = await propertyMediaRepository.findActiveById(mediaId, propertyId);
  if (!media) {
    throw new MediaNotFoundError();
  }

  await propertyMediaRepository.softDelete(mediaId);

  try {
    await getStorageProvider().delete(media.storageKey);
  } catch (error) {
    logger.warn("Falha ao remover foto do storage (não bloqueia a operação)", {
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }

  if (media.isCover) {
    const remaining = await propertyMediaRepository.findActiveByProperty(propertyId);
    const next = remaining[0];
    if (next) {
      await propertyMediaRepository.setCover(propertyId, next.id);
    }
  }
}

/** RN-034: permite trocar a foto de capa. */
export async function setCoverPhoto(
  propertyId: string,
  brokerId: string,
  mediaId: string,
): Promise<void> {
  await getOwnProperty(propertyId, brokerId);

  const media = await propertyMediaRepository.findActiveById(mediaId, propertyId);
  if (!media) {
    throw new MediaNotFoundError();
  }

  await propertyMediaRepository.setCover(propertyId, mediaId);
}

/** RF-025: texto alternativo por foto, para acessibilidade e SEO. */
export async function setPhotoAltText(
  propertyId: string,
  brokerId: string,
  mediaId: string,
  altText: string,
): Promise<void> {
  await getOwnProperty(propertyId, brokerId);

  const media = await propertyMediaRepository.findActiveById(mediaId, propertyId);
  if (!media) {
    throw new MediaNotFoundError();
  }

  await propertyMediaRepository.updateAltText(mediaId, altText.trim() || null);
}

/** RN-045: reordena fotos (mover para cima/baixo). */
export async function movePropertyPhoto(
  propertyId: string,
  brokerId: string,
  mediaId: string,
  direction: "up" | "down",
): Promise<void> {
  await getOwnProperty(propertyId, brokerId);

  const items = await propertyMediaRepository.findActiveByProperty(propertyId);
  const index = items.findIndex((m) => m.id === mediaId);
  if (index === -1) {
    throw new MediaNotFoundError();
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) {
    return;
  }

  const current = items[index];
  const neighbor = items[swapIndex];
  if (!current || !neighbor) {
    return;
  }

  await propertyMediaRepository.swapDisplayOrder(current, neighbor);
}
