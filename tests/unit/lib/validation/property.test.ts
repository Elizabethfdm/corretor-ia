import { describe, expect, it } from "vitest";
import {
  basicInfoSchema,
  characteristicsSchema,
  descriptionSchema,
  getPropertyPublicationRequirementErrors,
  locationSchema,
} from "@/lib/validation/property";

const validBasicInfo = {
  internalTitle: "Casa com piscina no Jardim Europa",
  purpose: "SALE",
  propertyType: "HOUSE",
};

describe("basicInfoSchema", () => {
  it("aceita o mínimo obrigatório (título, finalidade, tipo)", () => {
    expect(basicInfoSchema.safeParse(validBasicInfo).success).toBe(true);
  });

  it("rejeita título interno vazio ou muito curto", () => {
    expect(basicInfoSchema.safeParse({ ...validBasicInfo, internalTitle: "" }).success).toBe(false);
    expect(basicInfoSchema.safeParse({ ...validBasicInfo, internalTitle: "A" }).success).toBe(
      false,
    );
  });

  it("rejeita finalidade ou tipo fora do enum", () => {
    expect(basicInfoSchema.safeParse({ ...validBasicInfo, purpose: "ALUGUEL" }).success).toBe(
      false,
    );
    expect(basicInfoSchema.safeParse({ ...validBasicInfo, propertyType: "CASTELO" }).success).toBe(
      false,
    );
  });

  it("mantém o valor monetário como string, preservando os centavos (RN-030)", () => {
    const result = basicInfoSchema.safeParse({ ...validBasicInfo, price: "450000.50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe("450000.50");
      expect(typeof result.data.price).toBe("string");
    }
  });

  it("rejeita valor monetário em formato inválido", () => {
    expect(
      basicInfoSchema.safeParse({ ...validBasicInfo, price: "quatrocentos mil" }).success,
    ).toBe(false);
  });

  it("converte string vazia em undefined para campos opcionais", () => {
    const result = basicInfoSchema.safeParse({ ...validBasicInfo, price: "", referenceCode: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBeUndefined();
      expect(result.data.referenceCode).toBeUndefined();
    }
  });

  it("interpreta checkbox 'on' do FormData como true e ausência como default", () => {
    const checked = basicInfoSchema.safeParse({ ...validBasicInfo, featured: "on" });
    expect(checked.success).toBe(true);
    if (checked.success) expect(checked.data.featured).toBe(true);

    const unchecked = basicInfoSchema.safeParse(validBasicInfo);
    expect(unchecked.success).toBe(true);
    if (unchecked.success) {
      expect(unchecked.data.featured).toBe(false);
      expect(unchecked.data.showPrice).toBe(true);
    }
  });
});

describe("characteristicsSchema", () => {
  it("aceita todos os campos ausentes (nada é obrigatório)", () => {
    expect(characteristicsSchema.safeParse({}).success).toBe(true);
  });

  it("coage campos numéricos vindos como string de FormData", () => {
    const result = characteristicsSchema.safeParse({ bedrooms: "3", bathrooms: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bedrooms).toBe(3);
      expect(result.data.bathrooms).toBe(2);
    }
  });

  it("rejeita números negativos", () => {
    expect(characteristicsSchema.safeParse({ bedrooms: "-1" }).success).toBe(false);
  });

  it("rejeita ano de construção fora do intervalo aceitável", () => {
    expect(characteristicsSchema.safeParse({ constructionYear: "1700" }).success).toBe(false);
    expect(
      characteristicsSchema.safeParse({
        constructionYear: String(new Date().getFullYear() + 10),
      }).success,
    ).toBe(false);
  });

  it("aceita uma lista de características do enum FeatureType", () => {
    const result = characteristicsSchema.safeParse({ features: ["POOL", "BARBECUE"] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.features).toEqual(["POOL", "BARBECUE"]);
  });

  it("rejeita característica fora do enum", () => {
    expect(characteristicsSchema.safeParse({ features: ["SAUNA_INFINITA"] }).success).toBe(false);
  });

  it("assume lista vazia de características quando omitida", () => {
    const result = characteristicsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.features).toEqual([]);
  });
});

describe("locationSchema", () => {
  it("aceita todos os campos ausentes", () => {
    expect(locationSchema.safeParse({}).success).toBe(true);
  });

  it("aceita CEP com ou sem hífen", () => {
    expect(locationSchema.safeParse({ zipCode: "01310-100" }).success).toBe(true);
    expect(locationSchema.safeParse({ zipCode: "01310100" }).success).toBe(true);
  });

  it("rejeita CEP em formato inválido", () => {
    expect(locationSchema.safeParse({ zipCode: "123" }).success).toBe(false);
  });

  it("normaliza a UF para maiúsculas", () => {
    const result = locationSchema.safeParse({ state: "sp" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.state).toBe("SP");
  });

  it("rejeita UF com mais de duas letras", () => {
    expect(locationSchema.safeParse({ state: "SPX" }).success).toBe(false);
  });

  it("usa HIDDEN_EXACT como padrão de visibilidade (RN-041)", () => {
    const result = locationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.visibilityType).toBe("HIDDEN_EXACT");
  });
});

describe("descriptionSchema", () => {
  it("aceita todos os campos ausentes", () => {
    expect(descriptionSchema.safeParse({}).success).toBe(true);
  });

  it("rejeita descrição acima do limite de 5000 caracteres", () => {
    expect(descriptionSchema.safeParse({ description: "a".repeat(5001) }).success).toBe(false);
  });

  it("rejeita título de SEO acima do limite de 70 caracteres", () => {
    expect(descriptionSchema.safeParse({ seoTitle: "a".repeat(71) }).success).toBe(false);
  });
});

describe("getPropertyPublicationRequirementErrors (RN-043)", () => {
  const complete = {
    internalTitle: "Casa com piscina",
    price: "450000",
    showPrice: true,
    city: "São Paulo",
    neighborhood: "Jardim Europa",
    description: "Uma bela casa.",
    mediaCount: 3,
  };

  it("retorna vazio quando todos os requisitos de publicação estão presentes", () => {
    expect(getPropertyPublicationRequirementErrors(complete)).toHaveLength(0);
  });

  it("não exige valor quando showPrice é false ('consulte o valor')", () => {
    const errors = getPropertyPublicationRequirementErrors({
      ...complete,
      showPrice: false,
      price: undefined,
    });
    expect(errors).toHaveLength(0);
  });

  it("exige valor quando showPrice é true", () => {
    const errors = getPropertyPublicationRequirementErrors({ ...complete, price: undefined });
    expect(errors).toContain('Informe o valor ou marque a opção "Consulte o valor".');
  });

  it("exige ao menos uma foto", () => {
    const errors = getPropertyPublicationRequirementErrors({ ...complete, mediaCount: 0 });
    expect(errors).toContain("Adicione ao menos uma foto do imóvel.");
  });

  it("lista todos os campos ausentes quando o imóvel está totalmente vazio", () => {
    const errors = getPropertyPublicationRequirementErrors({
      showPrice: true,
      mediaCount: 0,
    });
    expect(errors).toHaveLength(6);
  });
});
