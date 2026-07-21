import { FakeAiProvider } from "@/lib/ai/providers/fake-ai-provider";
import { AnthropicAiProvider } from "@/lib/ai/providers/anthropic-ai-provider";
import type { AiContentProvider } from "@/lib/ai/types";

export type {
  AiContentProvider,
  PropertyAdvertisementInput,
  PropertyAdvertisementOutput,
  PropertyAdvertisementSubject,
  AdvertisementSize,
} from "@/lib/ai/types";
export { AiProviderError, ADVERTISEMENT_SIZES } from "@/lib/ai/types";

let cachedProvider: AiContentProvider | undefined;

/**
 * Seleciona o provedor de IA via AI_PROVIDER (ADR-0004): "anthropic" em
 * produção (exige AI_API_KEY), "fake" (padrão) em desenvolvimento/
 * testes — determinístico, sem rede nem custo.
 */
export function getAiProvider(): AiContentProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = process.env["AI_PROVIDER"] ?? "fake";

  if (provider === "anthropic") {
    const apiKey = process.env["AI_API_KEY"];
    if (!apiKey) {
      throw new Error(
        'AI_PROVIDER="anthropic" exige a variável de ambiente AI_API_KEY (RN-074 — nunca no cliente).',
      );
    }
    const timeoutMs = Number(process.env["AI_REQUEST_TIMEOUT_MS"]) || undefined;
    cachedProvider = new AnthropicAiProvider(apiKey, process.env["AI_MODEL"], timeoutMs);
    return cachedProvider;
  }

  if (provider !== "fake") {
    throw new Error(
      `Provedor de IA "${provider}" não implementado. Use "anthropic" ou "fake" (ver ADR-0004).`,
    );
  }

  cachedProvider = new FakeAiProvider();
  return cachedProvider;
}
