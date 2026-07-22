import { describe, expect, it } from "vitest";
import { generateArtworkSchema } from "@/lib/validation/artwork";

describe("generateArtworkSchema (RF-062, RF-063)", () => {
  const validInput = {
    propertyId: "property-123",
    photoMediaId: "media-123",
    format: "SQUARE_FEED",
    templateType: "NEW_PROPERTY",
    title: "Casa nova no Jardim Europa",
    subtitle: "3 quartos · 120 m² · R$ 450.000,00",
    callToAction: "Fale comigo e agende uma visita",
  };

  it("aceita o preenchimento completo", () => {
    expect(generateArtworkSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejeita formato ou tipo fora do enum", () => {
    expect(generateArtworkSchema.safeParse({ ...validInput, format: "TIKTOK_FEED" }).success).toBe(
      false,
    );
    expect(
      generateArtworkSchema.safeParse({ ...validInput, templateType: "INEXISTENTE" }).success,
    ).toBe(false);
  });

  it("rejeita imóvel ou foto não selecionados", () => {
    expect(generateArtworkSchema.safeParse({ ...validInput, propertyId: "" }).success).toBe(false);
    expect(generateArtworkSchema.safeParse({ ...validInput, photoMediaId: "" }).success).toBe(
      false,
    );
  });

  it("rejeita título ou chamada para ação vazios", () => {
    expect(generateArtworkSchema.safeParse({ ...validInput, title: "" }).success).toBe(false);
    expect(generateArtworkSchema.safeParse({ ...validInput, callToAction: "" }).success).toBe(
      false,
    );
  });

  it("assume subtítulo vazio quando ausente (foto sem quartos/área/preço exibível)", () => {
    const withoutSubtitle: Record<string, unknown> = { ...validInput };
    delete withoutSubtitle["subtitle"];

    const result = generateArtworkSchema.safeParse(withoutSubtitle);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.subtitle).toBe("");
  });

  it("rejeita título além do limite de caracteres (RN-077 — garante que sempre caiba no modelo)", () => {
    expect(generateArtworkSchema.safeParse({ ...validInput, title: "a".repeat(71) }).success).toBe(
      false,
    );
    expect(generateArtworkSchema.safeParse({ ...validInput, title: "a".repeat(70) }).success).toBe(
      true,
    );
  });

  it("rejeita subtítulo além do limite de caracteres", () => {
    expect(
      generateArtworkSchema.safeParse({ ...validInput, subtitle: "a".repeat(111) }).success,
    ).toBe(false);
  });

  it("rejeita chamada para ação além do limite de caracteres", () => {
    expect(
      generateArtworkSchema.safeParse({ ...validInput, callToAction: "a".repeat(51) }).success,
    ).toBe(false);
  });
});
