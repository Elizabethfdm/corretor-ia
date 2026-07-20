import sharp, { type Metadata } from "sharp";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class UnsupportedImageFormatError extends Error {
  constructor() {
    super("Formato de imagem não suportado.");
    this.name = "UnsupportedImageFormatError";
  }
}

export interface ProcessImageOptions {
  maxWidth: number;
  maxHeight: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/jpeg";
  width: number;
  height: number;
}

/**
 * Valida (RN-035) e comprime/redimensiona (RN-024) uma imagem enviada
 * pelo usuário. A validação de formato é feita pelo conteúdo real do
 * arquivo (via sharp), não pelo tipo MIME declarado pelo navegador.
 * A saída é sempre JPEG, o que descarta metadados originais (EXIF/GPS)
 * por padrão do sharp — cumprindo RN-037 sem passo extra.
 */
export async function processProfileImage(
  input: Buffer,
  options: ProcessImageOptions,
): Promise<ProcessedImage> {
  let metadata: Metadata;

  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new UnsupportedImageFormatError();
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new UnsupportedImageFormatError();
  }

  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    contentType: "image/jpeg",
    width: info.width,
    height: info.height,
  };
}
