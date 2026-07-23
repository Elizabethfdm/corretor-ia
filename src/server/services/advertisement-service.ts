import { advertisementRepository } from "@/server/repositories/advertisement-repository";
import { getOwnProperty } from "@/server/services/property-service";
import { buildAdvertisementPrompt as composeAdvertisementPrompt } from "@/lib/advertisement/build-prompt";
import type {
  AdvertisementPromptInput,
  AdvertisementPropertySubject,
} from "@/lib/advertisement/types";
import type {
  BuildAdvertisementPromptInput,
  EditAdvertisementInput,
  SaveAdvertisementInput,
} from "@/lib/validation/advertisement";
import { FEATURE_LABELS, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";
import { buildPublicTitle } from "@/lib/property/build-public-title";
import type { PropertyWithRelations } from "@/server/repositories/property-repository";

/** Identifica no histórico que o texto veio do fluxo manual (prompt copiado, resposta colada), não de uma chamada de API própria. */
const ADVERTISEMENT_PROVIDER = "manual";
const ADVERTISEMENT_MODEL = "chatgpt-web";

export class AdvertisementNotFoundError extends Error {
  constructor() {
    super("Anúncio não encontrado.");
    this.name = "AdvertisementNotFoundError";
  }
}

/**
 * RN-061, RN-065: allowlist explícita dos dados do imóvel usados no
 * prompt — nunca `internalNotes`, `internalTitle`, `referenceCode` ou
 * endereço exato (rua/número), mesmo quando o corretor optou por
 * exibi-lo publicamente na página do imóvel (ver
 * `lib/advertisement/types.ts`). Título usa a mesma síntese do catálogo
 * público (`buildPublicTitle`) — nunca cai para `internalTitle` bruto.
 */
function buildPropertySubject(property: PropertyWithRelations): AdvertisementPropertySubject {
  return {
    title: buildPublicTitle(property),
    purpose: PURPOSE_LABELS[property.purpose],
    propertyType: PROPERTY_TYPE_LABELS[property.propertyType],
    price: property.price?.toString() ?? null,
    showPrice: property.showPrice,
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    totalArea: property.totalArea?.toString() ?? null,
    builtArea: property.builtArea?.toString() ?? null,
    city: property.address?.city ?? null,
    neighborhood: property.address?.neighborhood ?? null,
    features: property.features.map((f) => FEATURE_LABELS[f.featureType]),
    description: property.description,
    highlights: property.highlights,
    financingAccepted: property.financingAccepted,
    exchangeAccepted: property.exchangeAccepted,
  };
}

/** RN-058: histórico de anúncios de um imóvel, isolado por corretor (RN-026). */
export async function listAdvertisementsForProperty(propertyId: string, brokerId: string) {
  await getOwnProperty(propertyId, brokerId);
  return advertisementRepository.findManyByProperty(propertyId, brokerId);
}

/**
 * RN-061 a RN-065: monta o prompt (texto autocontido, ver
 * `lib/advertisement/build-prompt.ts`) a partir dos dados do imóvel do
 * corretor autenticado — não persiste nada; o corretor copia o
 * resultado e leva para a ferramenta de IA de sua escolha.
 */
export async function buildAdvertisementPrompt(
  brokerId: string,
  input: BuildAdvertisementPromptInput,
): Promise<string> {
  const property = await getOwnProperty(input.propertyId, brokerId);

  const promptInput: AdvertisementPromptInput = {
    channel: input.channel,
    tone: input.tone,
    size: input.size,
    objective: input.objective,
    targetAudience: input.targetAudience ?? null,
    highlightAspects: input.highlightAspects,
    property: buildPropertySubject(property),
  };

  return composeAdvertisementPrompt(promptInput);
}

/**
 * RN-066 a RN-068: persiste o anúncio depois que o corretor cola de
 * volta o texto obtido na ferramenta de IA externa — nunca publicado
 * automaticamente, sempre editável depois, sempre sinalizado como
 * assistido por IA (RN-073: `SubmitButton` já previne duplo envio via
 * `useFormStatus`, mesmo padrão de toda a aplicação).
 */
export async function saveAdvertisement(brokerId: string, input: SaveAdvertisementInput) {
  const property = await getOwnProperty(input.propertyId, brokerId);

  return advertisementRepository.create({
    broker: { connect: { id: brokerId } },
    property: { connect: { id: property.id } },
    channel: input.channel,
    tone: input.tone,
    size: input.size,
    objective: input.objective,
    targetAudience: input.targetAudience ?? null,
    highlightAspects: input.highlightAspects,
    title: input.title,
    content: input.content,
    callToAction: input.callToAction,
    hashtags: input.hashtags,
    provider: ADVERTISEMENT_PROVIDER,
    model: ADVERTISEMENT_MODEL,
    status: "GENERATED",
  });
}

/** RF-057: o corretor pode editar o conteúdo salvo antes de copiar ou compartilhar. */
export async function editAdvertisement(
  id: string,
  brokerId: string,
  input: EditAdvertisementInput,
) {
  const existing = await advertisementRepository.findByIdForBroker(id, brokerId);
  if (!existing) {
    throw new AdvertisementNotFoundError();
  }
  return advertisementRepository.updateContent(id, input);
}
