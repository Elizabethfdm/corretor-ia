import { describe, expect, it } from "vitest";
import { buildAdvertisementPrompt } from "@/lib/advertisement/build-prompt";
import type { AdvertisementPromptInput } from "@/lib/advertisement/types";

const baseInput: AdvertisementPromptInput = {
  channel: "INSTAGRAM",
  tone: "PROFESSIONAL",
  size: "MEDIUM",
  objective: "Atrair famílias jovens",
  targetAudience: null,
  highlightAspects: [],
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

describe("buildAdvertisementPrompt (RN-061 a RN-066)", () => {
  it("proíbe invenção de dados, promessas indevidas e linguagem discriminatória", () => {
    const prompt = buildAdvertisementPrompt(baseInput);
    expect(prompt).toContain("Nunca invente");
    expect(prompt).toContain("Nunca prometa valorização");
    expect(prompt).toContain("Nunca use linguagem discriminatória");
    expect(prompt).toContain("dado pessoal de terceiros");
  });

  it("pede a resposta em rótulos de texto simples, para um humano copiar (não JSON)", () => {
    const prompt = buildAdvertisementPrompt(baseInput);
    expect(prompt).toContain("TÍTULO:");
    expect(prompt).toContain("TEXTO:");
    expect(prompt).toContain("CHAMADA PARA AÇÃO:");
    expect(prompt).toContain("HASHTAGS:");
  });

  it("inclui os dados fornecidos do imóvel", () => {
    const prompt = buildAdvertisementPrompt(baseInput);
    expect(prompt).toContain("Casa com piscina");
    expect(prompt).toContain("Jardim Europa, São Paulo");
    expect(prompt).toContain("Piscina, Churrasqueira");
    expect(prompt).toContain("Aceita financiamento");
  });

  it("omite campos ausentes em vez de inventar um valor", () => {
    const prompt = buildAdvertisementPrompt({
      ...baseInput,
      property: { ...baseInput.property, suites: null, builtArea: null, highlights: null },
    });
    expect(prompt).not.toContain("Suítes:");
    expect(prompt).not.toContain("Área construída");
    expect(prompt).not.toContain("Diferenciais cadastrados");
  });

  it("instrui a não mencionar valor quando showPrice é falso", () => {
    const prompt = buildAdvertisementPrompt({
      ...baseInput,
      property: { ...baseInput.property, showPrice: false },
    });
    expect(prompt).toContain("não divulgado");
    expect(prompt).not.toContain("450000");
  });

  it("nunca inclui endereço exato — o tipo de entrada nem permite rua/número", () => {
    const prompt = buildAdvertisementPrompt(baseInput);
    // Garantia estrutural: AdvertisementPropertySubject não tem campos de rua/número.
    expect(prompt).not.toMatch(/rua|avenida|número/i);
  });

  it("inclui aspectos a destacar e público-alvo quando informados", () => {
    const prompt = buildAdvertisementPrompt({
      ...baseInput,
      targetAudience: "Investidores",
      highlightAspects: ["Piscina", "Área gourmet"],
    });
    expect(prompt).toContain("Investidores");
    expect(prompt).toContain("Piscina, Área gourmet");
  });
});
