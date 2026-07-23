import { describe, expect, it } from "vitest";
import {
  buildAdvertisementPromptSchema,
  editAdvertisementSchema,
  saveAdvertisementSchema,
} from "@/lib/validation/advertisement";

describe("buildAdvertisementPromptSchema (RF-054)", () => {
  const validInput = {
    propertyId: "property-123",
    channel: "INSTAGRAM",
    tone: "PROFESSIONAL",
    size: "MEDIUM",
    objective: "Atrair famílias jovens",
  };

  it("aceita o mínimo obrigatório", () => {
    expect(buildAdvertisementPromptSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejeita canal, tom ou tamanho fora do enum", () => {
    expect(
      buildAdvertisementPromptSchema.safeParse({ ...validInput, channel: "TIKTOK" }).success,
    ).toBe(false);
    expect(
      buildAdvertisementPromptSchema.safeParse({ ...validInput, tone: "ENGRAÇADO" }).success,
    ).toBe(false);
    expect(
      buildAdvertisementPromptSchema.safeParse({ ...validInput, size: "GIGANTE" }).success,
    ).toBe(false);
  });

  it("rejeita objetivo vazio ou ausente", () => {
    expect(buildAdvertisementPromptSchema.safeParse({ ...validInput, objective: "" }).success).toBe(
      false,
    );
  });

  it("converte string vazia de público-alvo em undefined", () => {
    const result = buildAdvertisementPromptSchema.safeParse({
      ...validInput,
      targetAudience: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.targetAudience).toBeUndefined();
  });

  it("converte um único valor de highlightAspects em array", () => {
    const single = buildAdvertisementPromptSchema.safeParse({
      ...validInput,
      highlightAspects: "Piscina",
    });
    expect(single.success).toBe(true);
    if (single.success) expect(single.data.highlightAspects).toEqual(["Piscina"]);
  });

  it("assume lista vazia de aspectos quando ausente", () => {
    const result = buildAdvertisementPromptSchema.safeParse(validInput);
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

describe("saveAdvertisementSchema (RF-055 — o que o corretor cola de volta)", () => {
  const validInput = {
    propertyId: "property-123",
    channel: "INSTAGRAM",
    tone: "PROFESSIONAL",
    size: "MEDIUM",
    objective: "Atrair famílias jovens",
    title: "Casa incrível",
    content: "Texto do anúncio colado do ChatGPT.",
    callToAction: "Fale conosco!",
  };

  it("aceita a seleção original combinada com o conteúdo colado", () => {
    const result = saveAdvertisementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejeita quando falta a seleção original (propertyId/canal/tom/tamanho/objetivo)", () => {
    const withoutPropertyId: Record<string, unknown> = { ...validInput };
    delete withoutPropertyId["propertyId"];
    expect(saveAdvertisementSchema.safeParse(withoutPropertyId).success).toBe(false);
  });

  it("rejeita quando falta o conteúdo colado (título/texto/chamada para ação)", () => {
    const withoutTitle: Record<string, unknown> = { ...validInput };
    delete withoutTitle["title"];
    expect(saveAdvertisementSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it("assume hashtags vazias quando o campo está ausente", () => {
    const result = saveAdvertisementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hashtags).toEqual([]);
  });
});
