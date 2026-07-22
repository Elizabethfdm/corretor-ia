import type {
  AiContentProvider,
  PropertyAdvertisementInput,
  PropertyAdvertisementOutput,
} from "@/lib/ai/types";

/**
 * Provedor padrão de desenvolvimento e testes (mesmo padrão do
 * `ConsoleEmailProvider`, ADR-0005): determinístico, sem rede nem
 * custo, nunca inventa nada além do que já está em `input` — permite
 * que o fluxo de geração de anúncio seja testável de ponta a ponta sem
 * depender de uma chave de API real.
 */
export class FakeAiProvider implements AiContentProvider {
  readonly name = "fake";
  readonly model = "fake-deterministic-v1";

  async generatePropertyAdvertisement(
    input: PropertyAdvertisementInput,
  ): Promise<PropertyAdvertisementOutput> {
    await Promise.resolve();

    const { property } = input;
    const location = [property.neighborhood, property.city].filter(Boolean).join(", ");

    return {
      title: `${property.title}${location ? ` — ${location}` : ""}`,
      content: [
        `${property.propertyType} para ${property.purpose.toLowerCase()}${location ? ` em ${location}` : ""}.`,
        property.description ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      callToAction: "Entre em contato para saber mais!",
      hashtags: input.highlightAspects
        .slice(0, 5)
        .map((aspect) => aspect.toLowerCase().replace(/\s+/g, "")),
    };
  }
}
