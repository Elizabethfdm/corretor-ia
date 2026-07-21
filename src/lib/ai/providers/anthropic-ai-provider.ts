import Anthropic from "@anthropic-ai/sdk";
import {
  buildAdvertisementSystemPrompt,
  buildAdvertisementUserPrompt,
} from "@/lib/ai/build-advertisement-prompt";
import { advertisementOutputSchema } from "@/lib/validation/advertisement";
import { AiProviderError } from "@/lib/ai/types";
import type {
  AiContentProvider,
  PropertyAdvertisementInput,
  PropertyAdvertisementOutput,
} from "@/lib/ai/types";
import { logger } from "@/lib/observability/logger";

const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
/** RN-072: timeout obrigatório — texto curto, não precisa do padrão de 10 minutos do SDK. */
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Adaptador real via Anthropic Claude API (ADR-0004). `server/services`
 * nunca importa `@anthropic-ai/sdk` diretamente — só através desta
 * classe, atrás da interface `AiContentProvider`.
 */
export class AnthropicAiProvider implements AiContentProvider {
  readonly name = "anthropic";
  readonly model: string;
  private readonly client: Anthropic;

  constructor(apiKey: string, model = DEFAULT_MODEL, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    this.model = model;
    this.client = new Anthropic({ apiKey, timeout: timeoutMs, maxRetries: 1 });
  }

  async generatePropertyAdvertisement(
    input: PropertyAdvertisementInput,
  ): Promise<PropertyAdvertisementOutput> {
    let responseText: string;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: buildAdvertisementSystemPrompt(),
        messages: [{ role: "user", content: buildAdvertisementUserPrompt(input) }],
        temperature: 0.7,
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock) {
        throw new AiProviderError("O provedor de IA não retornou nenhum texto.");
      }
      responseText = textBlock.text;
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }
      logger.warn("Falha ao chamar o provedor de IA (Anthropic)", {
        error: error instanceof Error ? error.message : "erro desconhecido",
      });
      if (error instanceof Anthropic.APIError) {
        throw new AiProviderError(
          "Não foi possível gerar o anúncio agora. Tente novamente em instantes.",
          error,
        );
      }
      throw new AiProviderError("Falha inesperada ao gerar o anúncio.", error);
    }

    return this.parseResponse(responseText);
  }

  private parseResponse(responseText: string): PropertyAdvertisementOutput {
    let raw: unknown;
    try {
      raw = JSON.parse(responseText);
    } catch {
      throw new AiProviderError("O provedor de IA retornou uma resposta em formato inesperado.");
    }

    const parsed = advertisementOutputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AiProviderError("O provedor de IA retornou uma resposta em formato inesperado.");
    }

    return parsed.data;
  }
}
