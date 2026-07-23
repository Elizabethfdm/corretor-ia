import type { AdvertisementPromptInput } from "@/lib/advertisement/types";

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

function formatLine(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return `${label}: ${value}`;
}

/**
 * RN-061 a RN-065: monta um prompt único, autocontido, pronto para o
 * corretor copiar e colar diretamente numa ferramenta de IA de sua
 * escolha (ex.: ChatGPT) — instruções explícitas contra invenção de
 * dados, promessas indevidas, linguagem discriminatória e vazamento de
 * dados privados, seguidas dos dados do imóvel (allowlist restrita,
 * nunca o objeto `Property` bruto). RN-066: nunca instrui a IA a
 * "publicar" nada, apenas gerar texto para revisão do corretor. Pede
 * a resposta em rótulos de texto simples (não JSON) porque quem lê a
 * resposta é uma pessoa copiando trechos manualmente, não código.
 */
export function buildAdvertisementPrompt(input: AdvertisementPromptInput): string {
  const { property } = input;
  const location = [property.neighborhood, property.city].filter(Boolean).join(", ");

  const instructions = [
    "Você é um redator publicitário especializado em anúncios imobiliários no Brasil. Escreva em português do Brasil.",
    "Use exclusivamente as informações fornecidas abaixo sobre o imóvel. Nunca invente características, localização, valor, condições comerciais ou qualquer outro dado não informado.",
    'Nunca prometa valorização futura do imóvel, nunca afirme que um financiamento será aprovado, e nunca crie senso de urgência falso (ex.: "última unidade", "oferta por tempo limitado") a menos que isso conste explicitamente nas informações abaixo.',
    "Nunca use linguagem discriminatória (de qualquer natureza: racial, religiosa, de gênero, orientação sexual, deficiência, origem, entre outras).",
    "Nunca inclua endereço exato, observações internas do corretor ou qualquer dado pessoal de terceiros — essas informações não estão nos dados abaixo, mas reforce isso na sua resposta.",
    "Quando um dado relevante para o anúncio não for informado abaixo, não invente um valor — simplesmente não mencione esse aspecto.",
    "",
    "Responda exatamente neste formato, com estes rótulos, sem markdown e sem nenhum texto antes ou depois:",
    "",
    "TÍTULO: (um título curto e chamativo)",
    "TEXTO: (o corpo do anúncio)",
    "CHAMADA PARA AÇÃO: (uma frase curta convidando o leitor a entrar em contato)",
    "HASHTAGS: (3 a 8 hashtags relevantes separadas por vírgula, sem o caractere #; deixe em branco se o canal não usar hashtags)",
  ].join("\n");

  const requestLines = [
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
    property.showPrice
      ? formatLine("Valor", property.price)
      : "Valor: não divulgado (não mencionar valor no anúncio)",
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

  return [instructions, "", requestLines.join("\n")].join("\n");
}
