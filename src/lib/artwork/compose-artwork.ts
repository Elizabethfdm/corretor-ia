import sharp, { type OverlayOptions } from "sharp";
import { ArtworkFormat, ArtworkTemplateType } from "@/generated/prisma/enums";
import { ARTWORK_FORMAT_DIMENSIONS, ARTWORK_TEMPLATE_TYPE_LABELS } from "@/lib/artwork/labels";
import { escapePangoMarkup } from "@/lib/artwork/pango-markup";

export class ArtworkRenderError extends Error {
  constructor(message = "Não foi possível gerar a arte. Tente novamente.") {
    super(message);
    this.name = "ArtworkRenderError";
  }
}

/** RN-076: cor padrão da plataforma por tipo, usada quando o corretor não configurou identidade visual. */
const DEFAULT_TYPE_COLOR: Record<ArtworkTemplateType, string> = {
  [ArtworkTemplateType.NEW_PROPERTY]: "#16a34a",
  [ArtworkTemplateType.HIGHLIGHT]: "#f59e0b",
  [ArtworkTemplateType.OPPORTUNITY]: "#ef4444",
  [ArtworkTemplateType.SALE]: "#2563eb",
  [ArtworkTemplateType.RENT]: "#7c3aed",
  [ArtworkTemplateType.PRICE_DROP]: "#dc2626",
  [ArtworkTemplateType.RESERVED]: "#6b7280",
  [ArtworkTemplateType.SOLD]: "#111827",
  [ArtworkTemplateType.OPEN_HOUSE]: "#0891b2",
};

export interface ComposeArtworkInput {
  format: ArtworkFormat;
  templateType: ArtworkTemplateType;
  photoBuffer: Buffer;
  title: string;
  subtitle: string;
  callToAction: string;
  /** `broker.primaryColor` (RN-076) — `null` aplica a cor padrão da plataforma para o tipo. */
  accentColor: string | null;
  /** `broker.logoUrl` já buscado — ausência não impede a geração (best effort). */
  logoBuffer?: Buffer | null;
}

export interface ComposedArtwork {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: "image/jpeg";
}

/** RN-076: cor da marca do corretor quando configurada; padrão da plataforma por tipo caso contrário. */
export function resolveArtworkAccentColor(
  templateType: ArtworkTemplateType,
  brokerPrimaryColor: string | null,
): string {
  return brokerPrimaryColor ?? DEFAULT_TYPE_COLOR[templateType];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const int = Number.parseInt(normalized, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/**
 * RN-077: cada bloco recebe `width` e `height` — o próprio `sharp`
 * (Pango) ajusta automaticamente o tamanho da fonte para caber na
 * caixa, sem precisar de um algoritmo próprio de quebra/redução de
 * fonte (ver ADR-0006).
 */
function renderTextLayer(input: {
  text: string;
  width: number;
  height: number;
  bold: boolean;
  color: string;
  align?: "left" | "center";
}): Promise<Buffer> {
  const open = input.bold ? "<b>" : "";
  const close = input.bold ? "</b>" : "";
  const markup = `<span foreground="${input.color}">${open}${escapePangoMarkup(input.text)}${close}</span>`;

  return sharp({
    text: {
      text: markup,
      width: Math.max(input.width, 1),
      height: Math.max(input.height, 1),
      align: input.align ?? "left",
      rgba: true,
      font: "sans-serif",
      wrap: "word",
    },
  })
    .png()
    .toBuffer();
}

/**
 * Compõe a arte final: foto do imóvel (recortada sem distorção — RN-078)
 * com textos e identidade visual sobrepostos (RN-075, RN-076, RN-077).
 * Nunca lança para fora `ArtworkRenderError` genérico — falhas de
 * processamento da foto de origem são a causa mais provável de erro.
 */
export async function composeArtwork(input: ComposeArtworkInput): Promise<ComposedArtwork> {
  const { width, height } = ARTWORK_FORMAT_DIMENSIONS[input.format];
  const accentColor = resolveArtworkAccentColor(input.templateType, input.accentColor);
  const accentRgb = hexToRgb(accentColor);

  let base: Buffer;
  try {
    base = await sharp(input.photoBuffer)
      .resize({ width, height, fit: "cover" })
      .toBuffer();
  } catch {
    throw new ArtworkRenderError("Não foi possível processar a foto selecionada.");
  }

  const margin = Math.round(width * 0.06);
  const contentWidth = width - margin * 2;

  const scrimTop = Math.round(height * 0.55);
  const scrimHeight = height - scrimTop;

  const badgePaddingX = Math.round(margin * 0.5);
  const badgeHeight = Math.round(height * 0.055);
  const badgeWidth = Math.min(Math.round(width * 0.45), contentWidth);

  const titleTop = scrimTop + Math.round(height * 0.05);
  const titleHeight = Math.round(height * 0.16);

  const subtitleTop = titleTop + titleHeight;
  const subtitleHeight = Math.round(height * 0.07);

  const ctaTop = height - Math.round(height * 0.09);
  const ctaHeight = Math.round(height * 0.06);

  const logoSize = Math.round(width * 0.12);
  const ctaWidth = input.logoBuffer ? contentWidth - logoSize - margin : contentWidth;

  const [badgeLabel, titleLayer, subtitleLayer, ctaLayer] = await Promise.all([
    renderTextLayer({
      text: ARTWORK_TEMPLATE_TYPE_LABELS[input.templateType],
      width: badgeWidth - badgePaddingX * 2,
      height: badgeHeight - Math.round(badgeHeight * 0.2),
      bold: true,
      color: "#ffffff",
    }),
    renderTextLayer({
      text: input.title,
      width: contentWidth,
      height: titleHeight,
      bold: true,
      color: "#ffffff",
    }),
    input.subtitle.length > 0
      ? renderTextLayer({
          text: input.subtitle,
          width: contentWidth,
          height: subtitleHeight,
          bold: false,
          color: "#f4f4f5",
        })
      : null,
    renderTextLayer({
      text: input.callToAction,
      width: ctaWidth,
      height: ctaHeight,
      bold: true,
      color: "#ffffff",
    }),
  ]);

  const composites: OverlayOptions[] = [
    {
      input: {
        create: {
          width,
          height: scrimHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0.5 },
        },
      },
      top: scrimTop,
      left: 0,
    },
    {
      input: {
        create: {
          width: badgeWidth,
          height: badgeHeight,
          channels: 4,
          background: { ...accentRgb, alpha: 0.95 },
        },
      },
      top: margin,
      left: margin,
    },
    {
      input: badgeLabel,
      top: margin + Math.round(badgeHeight * 0.1),
      left: margin + badgePaddingX,
    },
    { input: titleLayer, top: titleTop, left: margin },
    { input: ctaLayer, top: ctaTop, left: margin },
  ];

  if (subtitleLayer) {
    composites.push({ input: subtitleLayer, top: subtitleTop, left: margin });
  }

  if (input.logoBuffer) {
    try {
      const logo = await sharp(input.logoBuffer)
        .resize({
          width: logoSize,
          height: logoSize,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input: logo,
        top: height - Math.round(height * 0.04) - logoSize,
        left: width - margin - logoSize,
      });
    } catch {
      // Best effort (RN-076) — logotipo indisponível não impede a geração da arte.
    }
  }

  const { data, info } = await sharp(base)
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, width: info.width, height: info.height, contentType: "image/jpeg" };
}
