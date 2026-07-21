import { describe, expect, it } from "vitest";
import {
  buildAdvertisementSystemPrompt,
  buildAdvertisementUserPrompt,
} from "@/lib/ai/build-advertisement-prompt";
import type { PropertyAdvertisementInput } from "@/lib/ai/types";

const baseInput: PropertyAdvertisementInput = {
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

describe("buildAdvertisementSystemPrompt (RN-062 a RN-066)", () => {
  it("proíbe invenção de dados, promessas indevidas e linguagem discriminatória", () => {
    const prompt = buildAdvertisementSystemPrompt();
    expect(prompt).toContain("Nunca invente");
    expect(prompt).toContain("Nunca prometa valorização");
    expect(prompt).toContain("Nunca use linguagem discriminatória");
    expect(prompt).toContain("dado pessoal de terceiros");
  });

  it("exige resposta em JSON com os campos esperados", () => {
    const prompt = buildAdvertisementSystemPrompt();
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"content"');
    expect(prompt).toContain('"callToAction"');
    expect(prompt).toContain('"hashtags"');
  });
});

describe("buildAdvertisementUserPrompt (RN-055, RN-061)", () => {
  it("inclui os dados fornecidos do imóvel", () => {
    const prompt = buildAdvertisementUserPrompt(baseInput);
    expect(prompt).toContain("Casa com piscina");
    expect(prompt).toContain("Jardim Europa, São Paulo");
    expect(prompt).toContain("Piscina, Churrasqueira");
    expect(prompt).toContain("Aceita financiamento");
  });

  it("omite campos ausentes em vez de inventar um valor", () => {
    const prompt = buildAdvertisementUserPrompt({
      ...baseInput,
      property: { ...baseInput.property, suites: null, builtArea: null, highlights: null },
    });
    expect(prompt).not.toContain("Suítes:");
    expect(prompt).not.toContain("Área construída");
    expect(prompt).not.toContain("Diferenciais cadastrados");
  });

  it("instrui a não mencionar valor quando showPrice é falso", () => {
    const prompt = buildAdvertisementUserPrompt({
      ...baseInput,
      property: { ...baseInput.property, showPrice: false },
    });
    expect(prompt).toContain("não divulgado");
    expect(prompt).not.toContain("450000");
  });

  it("nunca inclui endereço exato — o tipo de entrada nem permite rua/número", () => {
    const prompt = buildAdvertisementUserPrompt(baseInput);
    // Garantia estrutural: PropertyAdvertisementSubject não tem campos de rua/número.
    expect(prompt).not.toMatch(/rua|avenida|número/i);
  });

  it("inclui aspectos a destacar e público-alvo quando informados", () => {
    const prompt = buildAdvertisementUserPrompt({
      ...baseInput,
      targetAudience: "Investidores",
      highlightAspects: ["Piscina", "Área gourmet"],
    });
    expect(prompt).toContain("Investidores");
    expect(prompt).toContain("Piscina, Área gourmet");
  });
});
