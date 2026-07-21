import { ArtworkFormat, ArtworkTemplateType } from "@/generated/prisma/enums";

/** RF-062: rótulos exibidos ao corretor para cada formato de arte. */
export const ARTWORK_FORMAT_LABELS: Record<ArtworkFormat, string> = {
  [ArtworkFormat.SQUARE_FEED]: "Feed quadrado",
  [ArtworkFormat.VERTICAL_FEED]: "Feed vertical",
  [ArtworkFormat.STORY]: "Story",
  [ArtworkFormat.WHATSAPP_STATUS]: "Status do WhatsApp",
  [ArtworkFormat.REEL_COVER]: "Capa de Reel",
};

/**
 * Dimensões de renderização por formato (ADR-0006). Story, Status do
 * WhatsApp e capa de Reel usam a mesma resolução — são, na prática, o
 * mesmo formato vertical de tela cheia em cada plataforma.
 */
export const ARTWORK_FORMAT_DIMENSIONS: Record<ArtworkFormat, { width: number; height: number }> = {
  [ArtworkFormat.SQUARE_FEED]: { width: 1080, height: 1080 },
  [ArtworkFormat.VERTICAL_FEED]: { width: 1080, height: 1350 },
  [ArtworkFormat.STORY]: { width: 1080, height: 1920 },
  [ArtworkFormat.WHATSAPP_STATUS]: { width: 1080, height: 1920 },
  [ArtworkFormat.REEL_COVER]: { width: 1080, height: 1920 },
};

/** RF-062: rótulos exibidos ao corretor para cada tipo de anúncio. */
export const ARTWORK_TEMPLATE_TYPE_LABELS: Record<ArtworkTemplateType, string> = {
  [ArtworkTemplateType.NEW_PROPERTY]: "Novo imóvel",
  [ArtworkTemplateType.HIGHLIGHT]: "Destaque",
  [ArtworkTemplateType.OPPORTUNITY]: "Oportunidade",
  [ArtworkTemplateType.SALE]: "Venda",
  [ArtworkTemplateType.RENT]: "Aluguel",
  [ArtworkTemplateType.PRICE_DROP]: "Redução de preço",
  [ArtworkTemplateType.RESERVED]: "Reservado",
  [ArtworkTemplateType.SOLD]: "Vendido",
  [ArtworkTemplateType.OPEN_HOUSE]: "Visita aberta",
};
