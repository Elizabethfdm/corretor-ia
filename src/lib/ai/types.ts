import type { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";

/**
 * Dados do imóvel enviados ao provedor de IA — deliberadamente uma
 * lista de permissão (allowlist) restrita, nunca o objeto `Property`
 * bruto. RN-061: só dados do próprio imóvel. RN-065: nunca dados
 * privados — por isso não há campo de endereço exato (rua/número) aqui,
 * mesmo quando o corretor optou por exibi-lo publicamente na página do
 * imóvel: anúncios de marketing não devem direcionar visitas não
 * agendadas a um endereço específico.
 */
export interface PropertyAdvertisementSubject {
  title: string;
  purpose: string;
  propertyType: string;
  price: string | null;
  showPrice: boolean;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  totalArea: string | null;
  builtArea: string | null;
  city: string | null;
  neighborhood: string | null;
  features: string[];
  description: string | null;
  highlights: string | null;
  financingAccepted: boolean;
  exchangeAccepted: boolean;
}

export const ADVERTISEMENT_SIZES = ["SHORT", "MEDIUM", "LONG"] as const;
export type AdvertisementSize = (typeof ADVERTISEMENT_SIZES)[number];

export interface PropertyAdvertisementInput {
  channel: AdvertisementChannel;
  tone: AdvertisementTone;
  objective: string;
  size: AdvertisementSize;
  targetAudience: string | null;
  highlightAspects: string[];
  property: PropertyAdvertisementSubject;
}

export interface PropertyAdvertisementOutput {
  title: string;
  content: string;
  callToAction: string;
  hashtags: string[];
}

/** RN-071: erro de domínio — nunca vaza detalhes internos do SDK/provedor para a UI. */
export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export interface AiContentProvider {
  /** Nome do provedor (RN-069) — ex.: "anthropic", "fake". */
  readonly name: string;
  /** Identificador do modelo usado (RN-069) — ex.: "claude-sonnet-5". */
  readonly model: string;

  generatePropertyAdvertisement(
    input: PropertyAdvertisementInput,
  ): Promise<PropertyAdvertisementOutput>;
}
