import { describe, expect, it } from "vitest";
import {
  advertisementOutputSchema,
  editAdvertisementSchema,
  generateAdvertisementSchema,
} from "@/lib/validation/advertisement";

describe("generateAdvertisementSchema (RF-054)", () => {
  const validInput = {
    propertyId: "property-123",
    channel: "INSTAGRAM",
    tone: "PROFESSIONAL",
    size: "MEDIUM",
    objective: "Atrair famílias jovens",
  };

  it("aceita o mínimo obrigatório", () => {
    expect(generateAdvertisementSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejeita canal, tom ou tamanho fora do enum", () => {
    expect(
      generateAdvertisementSchema.safeParse({ ...validInput, channel: "TIKTOK" }).success,
    ).toBe(false);
    expect(
      generateAdvertisementSchema.safeParse({ ...validInput, tone: "ENGRAÇADO" }).success,
    ).toBe(false);
    expect(generateAdvertisementSchema.safeParse({ ...validInput, size: "GIGANTE" }).success).toBe(
      false,
    );
  });

  it("rejeita objetivo vazio ou ausente", () => {
    expect(generateAdvertisementSchema.safeParse({ ...validInput, objective: "" }).success).toBe(
      false,
    );
  });

  it("converte string vazia de público-alvo em undefined", () => {
    const result = generateAdvertisementSchema.safeParse({ ...validInput, targetAudience: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.targetAudience).toBeUndefined();
  });

  it("converte um único valor de highlightAspects em array", () => {
    const single = generateAdvertisementSchema.safeParse({
      ...validInput,
      highlightAspects: "Piscina",
    });
    expect(single.success).toBe(true);
    if (single.success) expect(single.data.highlightAspects).toEqual(["Piscina"]);
  });

  it("assume lista vazia de aspectos quando ausente", () => {
    const result = generateAdvertisementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.highlightAspects).toEqual([]);
  });
});

describe("editAdvertisementSchema (RF-057)", () => {
  it("aceita título, texto e chamada para ação preenchidos", () => {
    const result = editAdvertisementSchema.safeParse({
      title: "Casa incrível",
      content: "Descrição do anúncio.",
      callToAction: "Fale conosco!",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita título, texto ou chamada para ação vazios", () => {
    expect(
      editAdvertisementSchema.safeParse({ title: "", content: "x", callToAction: "x" }).success,
    ).toBe(false);
    expect(
      editAdvertisementSchema.safeParse({ title: "x", content: "", callToAction: "x" }).success,
    ).toBe(false);
    expect(
      editAdvertisementSchema.safeParse({ title: "x", content: "x", callToAction: "" }).success,
    ).toBe(false);
  });

  it("aceita hashtags como array vindo do formulário", () => {
    const result = editAdvertisementSchema.safeParse({
      title: "x",
      content: "x",
      callToAction: "x",
      hashtags: ["imoveis", "casa"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hashtags).toEqual(["imoveis", "casa"]);
  });
});

describe("advertisementOutputSchema (validação da resposta da IA, RN-071)", () => {
  it("aceita uma resposta bem formada", () => {
    const result = advertisementOutputSchema.safeParse({
      title: "Casa incrível",
      content: "Texto do anúncio.",
      callToAction: "Fale conosco!",
      hashtags: ["imoveis", "casa"],
    });
    expect(result.success).toBe(true);
  });

  it("assume hashtags vazias quando o campo está ausente", () => {
    const result = advertisementOutputSchema.safeParse({
      title: "Casa incrível",
      content: "Texto do anúncio.",
      callToAction: "Fale conosco!",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hashtags).toEqual([]);
  });

  it("rejeita resposta sem os campos obrigatórios (tratada como falha do provedor)", () => {
    expect(advertisementOutputSchema.safeParse({ title: "Só título" }).success).toBe(false);
    expect(advertisementOutputSchema.safeParse({}).success).toBe(false);
    expect(advertisementOutputSchema.safeParse(null).success).toBe(false);
  });
});
