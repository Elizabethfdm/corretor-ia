import type { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";

export const ADVERTISEMENT_SIZES = ["SHORT", "MEDIUM", "LONG"] as const;
export type AdvertisementSize = (typeof ADVERTISEMENT_SIZES)[number];

/**
 * Dados do imóvel usados para montar o prompt — deliberadamente uma
 * lista de permissão (allowlist) restrita, nunca o objeto `Property`
 * bruto. RN-061: só dados do próprio imóvel. RN-065: nunca dados
 * privados — por isso não há campo de endereço exato (rua/número) aqui,
 * mesmo quando o corretor optou por exibi-lo publicamente na página do
 * imóvel: o prompt de marketing não deve direcionar visitas não
 * agendadas a um endereço específico.
 */
export interface AdvertisementPropertySubject {
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

export interface AdvertisementPromptInput {
  channel: AdvertisementChannel;
  tone: AdvertisementTone;
  objective: string;
  size: AdvertisementSize;
  targetAudience: string | null;
  highlightAspects: string[];
  property: AdvertisementPropertySubject;
}

/**
 * Estado do formulário de montagem de prompt (`useActionState`) — além
 * do padrão de `ActionState`, carrega o prompt montado e a seleção
 * original do corretor, para o passo seguinte (colar o resultado)
 * reenviar os mesmos metadados sem o corretor preencher tudo de novo.
 */
export interface AdvertisementPromptState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  prompt?: string;
  selection?: {
    channel: AdvertisementChannel;
    tone: AdvertisementTone;
    size: AdvertisementSize;
    objective: string;
    targetAudience: string | null;
    highlightAspects: string[];
  };
}

export const idleAdvertisementPromptState: AdvertisementPromptState = { status: "idle" };
