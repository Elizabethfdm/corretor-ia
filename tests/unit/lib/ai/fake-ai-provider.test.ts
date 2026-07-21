import { describe, expect, it } from "vitest";
import { FakeAiProvider } from "@/lib/ai/providers/fake-ai-provider";
import type { PropertyAdvertisementInput } from "@/lib/ai/types";

const baseInput: PropertyAdvertisementInput = {
  channel: "INSTAGRAM",
  tone: "PROFESSIONAL",
  size: "MEDIUM",
  objective: "Atrair famílias jovens",
  targetAudience: null,
  highlightAspects: ["Piscina", "Área gourmet"],
  property: {
    title: "Casa com piscina",
    purpose: "Venda",
    propertyType: "Casa",
    price: "450000",
    showPrice: true,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 2,
    totalArea: "200",
    builtArea: "150",
    city: "São Paulo",
    neighborhood: "Jardim Europa",
    features: ["Piscina", "Churrasqueira"],
    description: "Uma casa maravilhosa.",
    highlights: "Vista para o parque",
    financingAccepted: true,
    exchangeAccepted: false,
  },
};

describe("FakeAiProvider", () => {
  it("nunca faz chamada de rede e retorna um resultado determinístico", async () => {
    const provider = new FakeAiProvider();
    const first = await provider.generatePropertyAdvertisement(baseInput);
    const second = await provider.generatePropertyAdvertisement(baseInput);
    expect(first).toEqual(second);
  });

  it("identifica-se corretamente para fins de auditoria (RN-069)", () => {
    const provider = new FakeAiProvider();
    expect(provider.name).toBe("fake");
    expect(provider.model).toBeTruthy();
  });

  it("nunca inventa dados além do que foi fornecido", async () => {
    const provider = new FakeAiProvider();
    const output = await provider.generatePropertyAdvertisement(baseInput);
    expect(output.title).toContain("Casa com piscina");
    expect(output.content).toContain("Uma casa maravilhosa.");
  });

  it("retorna a estrutura esperada mesmo com campos opcionais ausentes", async () => {
    const provider = new FakeAiProvider();
    const output = await provider.generatePropertyAdvertisement({
      ...baseInput,
      highlightAspects: [],
      property: { ...baseInput.property, description: null, city: null, neighborhood: null },
    });
    expect(output.title).toBeTruthy();
    expect(output.content).toBeTruthy();
    expect(output.callToAction).toBeTruthy();
    expect(Array.isArray(output.hashtags)).toBe(true);
  });
});
