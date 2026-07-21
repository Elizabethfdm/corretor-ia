import type { PropertyAdvertisementInput } from "@/lib/ai/types";

const CHANNEL_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram (post no feed)",
  FACEBOOK: "Facebook",
  WHATSAPP: "Mensagem de WhatsApp",
  STORY: "Story (Instagram/Facebook)",
  GENERIC: "Genérico (múltiplos canais)",
};

const TONE_LABELS: Record<string, string> = {
  PROFESSIONAL: "profissional",
  ELEGANT: "elegante",
  WELCOMING: "acolhedor",
  OBJECTIVE: "objetivo e direto",
  PERSUASIVE: "persuasivo",
  HIGH_END: "alto padrão/sofisticado",
  INVESTMENT: "foco em investimento/retorno financeiro",
};

const SIZE_LABELS: Record<string, string> = {
  SHORT: "curto (1 a 2 frases no corpo do texto)",
  MEDIUM: "médio (um parágrafo)",
  LONG: "longo (dois a três parágrafos, mais detalhado)",
};

/**
 * RN-062 a RN-065: instruções explícitas contra invenção de dados,
 * promessas indevidas, linguagem discriminatória e vazamento de dados
 * privados. RN-066: nunca instrui a IA a "publicar" nada, apenas gerar
 * texto para revisão do corretor.
 */
export function buildAdvertisementSystemPrompt(): string {
  return [
    "Você é um redator publicitário especializado em anúncios imobiliários no Brasil, escrevendo em português do Brasil.",
    "Use exclusivamente as informações fornecidas sobre o imóvel. Nunca invente características, localização, valor, condições comerciais ou qualquer outro dado não informado.",
    "Nunca prometa valorização futura do imóvel, nunca afirme que um financiamento será aprovado, e nunca crie senso de urgência falso (ex.: \"última unidade\", \"oferta por tempo limitado\") a menos que isso conste explicitamente nas informações fornecidas.",
    "Nunca use linguagem discriminatória (de qualquer natureza: racial, religiosa, de gênero, orientação sexual, deficiência, origem, entre outras).",
    "Nunca inclua endereço exato, observações internas do corretor ou qualquer dado pessoal de terceiros — essas informações nunca estarão nos dados fornecidos, mas reforce isso na sua resposta.",
    "Quando um dado relevante para o anúncio não for informado, não invente um valor — simplesmente não mencione esse aspecto.",
    "Responda EXCLUSIVAMENTE em JSON válido, sem nenhum texto antes ou depois, no seguinte formato:",
    '{"title": string, "content": string, "callToAction": string, "hashtags": string[]}',
    "\"title\" é um título curto e chamativo. \"content\" é o corpo do anúncio. \"callToAction\" é uma frase curta convidando o leitor a entrar em contato. \"hashtags\" é uma lista de 3 a 8 hashtags relevantes (sem o caractere #), ou uma lista vazia se o canal não usar hashtags.",
  ].join("\n");
}

function formatLine(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return `${label}: ${value}`;
}

/** RN-061: monta a descrição do imóvel só com os dados já validados/serializados pelo service — nunca o objeto Property bruto. */
export function buildAdvertisementUserPrompt(input: PropertyAdvertisementInput): string {
  const { property } = input;

  const location = [property.neighborhood, property.city].filter(Boolean).join(", ");

  const lines = [
    `Canal de publicação: ${CHANNEL_LABELS[input.channel] ?? input.channel}`,
    `Tom desejado: ${TONE_LABELS[input.tone] ?? input.tone}`,
    `Tamanho desejado do texto: ${SIZE_LABELS[input.size] ?? input.size}`,
    formatLine("Objetivo do anúncio", input.objective),
    formatLine("Público-alvo", input.targetAudience),
    input.highlightAspects.length > 0
      ? `Aspectos a destacar especialmente: ${input.highlightAspects.join(", ")}`
      : null,
    "",
    "Dados do imóvel:",
    formatLine("Título", property.title),
    formatLine("Finalidade", property.purpose),
    formatLine("Tipo", property.propertyType),
    property.showPrice ? formatLine("Valor", property.price) : "Valor: não divulgado (não mencionar valor no anúncio)",
    formatLine("Localização", location || null),
    formatLine("Quartos", property.bedrooms),
    formatLine("Suítes", property.suites),
    formatLine("Banheiros", property.bathrooms),
    formatLine("Vagas de garagem", property.parkingSpaces),
    formatLine("Área total (m²)", property.totalArea),
    formatLine("Área construída (m²)", property.builtArea),
    property.features.length > 0 ? `Características: ${property.features.join(", ")}` : null,
    property.financingAccepted ? "Aceita financiamento" : null,
    property.exchangeAccepted ? "Aceita permuta" : null,
    formatLine("Descrição cadastrada pelo corretor", property.description),
    formatLine("Diferenciais cadastrados pelo corretor", property.highlights),
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}
