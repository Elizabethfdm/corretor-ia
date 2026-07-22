import { advertisementRepository } from "@/server/repositories/advertisement-repository";
import { getOwnProperty } from "@/server/services/property-service";
import { getAiProvider } from "@/lib/ai";
import type { PropertyAdvertisementInput, PropertyAdvertisementSubject } from "@/lib/ai/types";
import type {
  EditAdvertisementInput,
  GenerateAdvertisementInput,
} from "@/lib/validation/advertisement";
import { FEATURE_LABELS, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";
import { buildPublicTitle } from "@/lib/property/build-public-title";
import type { PropertyWithRelations } from "@/server/repositories/property-repository";

const DEFAULT_MONTHLY_ADVERTISEMENT_LIMIT = 20;

/**
 * RN-070: limite de gerações por corretor, configurável via
 * AI_MONTHLY_GENERATION_LIMIT. Simplificação deliberada — o produto
 * ainda não tem sistema de planos/assinatura em nenhuma fase, então o
 * limite é um valor mensal fixo para todos os corretores, não
 * "conforme o plano". Revisitar quando um sistema de planos existir.
 */
export function getMonthlyAdvertisementLimit(): number {
  const configured = Number(process.env["AI_MONTHLY_GENERATION_LIMIT"]);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MONTHLY_ADVERTISEMENT_LIMIT;
}

export class AdvertisementLimitReachedError extends Error {
  constructor(limit: number) {
    super(`Limite de ${limit} anúncios gerados por mês atingido. Tente novamente no próximo mês.`);
    this.name = "AdvertisementLimitReachedError";
  }
}

export class AdvertisementNotFoundError extends Error {
  constructor() {
    super("Anúncio não encontrado.");
    this.name = "AdvertisementNotFoundError";
  }
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * RN-061, RN-065: allowlist explícita dos dados do imóvel enviados à
 * IA — nunca `internalNotes`, `internalTitle`, `referenceCode` ou
 * endereço exato (rua/número), mesmo quando o corretor optou por
 * exibir o endereço completo na página pública (ver
 * `lib/ai/types.ts`). Título usa a mesma síntese do catálogo público
 * (`buildPublicTitle`) — nunca cai para `internalTitle` bruto.
 */
function buildPropertySubject(property: PropertyWithRelations): PropertyAdvertisementSubject {
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
 * RN-061 a RN-074: gera um anúncio via `AiContentProvider`. Lança
 * `AdvertisementLimitReachedError` (RN-070) ou deixa propagar
 * `AiProviderError` do provedor (RN-071) — o chamador (Server Action)
 * decide a mensagem exibida. Só gerações bem-sucedidas são persistidas
 * e contam para o limite mensal; uma falha do provedor não consome
 * quota do corretor nem deixa um registro incompleto no histórico.
 *
 * RN-073 (sem geração duplicada por duplo clique): resolvido na UI —
 * `SubmitButton` desabilita o próprio formulário durante o envio
 * (`useFormStatus`), mesmo padrão já usado em toda a aplicação.
 */
export async function generateAdvertisement(brokerId: string, input: GenerateAdvertisementInput) {
  const property = await getOwnProperty(input.propertyId, brokerId);

  const limit = getMonthlyAdvertisementLimit();
  const usedThisMonth = await advertisementRepository.countByBrokerSince(
    brokerId,
    startOfCurrentMonth(),
  );
  if (usedThisMonth >= limit) {
    throw new AdvertisementLimitReachedError(limit);
  }

  const provider = getAiProvider();
  const aiInput: PropertyAdvertisementInput = {
    channel: input.channel,
    tone: input.tone,
    size: input.size,
    objective: input.objective,
    targetAudience: input.targetAudience ?? null,
    highlightAspects: input.highlightAspects,
    property: buildPropertySubject(property),
  };

  const output = await provider.generatePropertyAdvertisement(aiInput);

  return advertisementRepository.create({
    broker: { connect: { id: brokerId } },
    property: { connect: { id: property.id } },
    channel: input.channel,
    tone: input.tone,
    size: input.size,
    objective: input.objective,
    targetAudience: input.targetAudience ?? null,
    highlightAspects: input.highlightAspects,
    title: output.title,
    content: output.content,
    callToAction: output.callToAction,
    hashtags: output.hashtags,
    provider: provider.name,
    model: provider.model,
    status: "GENERATED",
  });
}

/** RF-057: o corretor pode editar o conteúdo gerado antes de copiar ou compartilhar. */
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
