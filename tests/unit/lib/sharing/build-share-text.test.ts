import { describe, expect, it } from "vitest";
import { buildCatalogShareText, buildPropertyShareText } from "@/lib/sharing/build-share-text";

describe("buildPropertyShareText (RN-055)", () => {
  it("inclui título, valor formatado e localização quando presentes", () => {
    const text = buildPropertyShareText({
      title: "Casa com piscina",
      price: "450000.5",
      showPrice: true,
      city: "São Paulo",
      neighborhood: "Jardim Europa",
    });
    expect(text).toContain("Casa com piscina");
    expect(text).toContain("R$");
    expect(text).toContain("450.000,50");
    expect(text).toContain("Jardim Europa, São Paulo");
  });

  it("omite o valor quando showPrice é falso, mesmo com price preenchido", () => {
    const text = buildPropertyShareText({
      title: "Apartamento",
      price: "300000",
      showPrice: false,
      city: null,
      neighborhood: null,
    });
    expect(text).not.toContain("R$");
    expect(text).toBe("Apartamento");
  });

  it("omite o valor quando price está ausente, mesmo com showPrice verdadeiro", () => {
    const text = buildPropertyShareText({
      title: "Apartamento",
      price: null,
      showPrice: true,
      city: null,
      neighborhood: null,
    });
    expect(text).not.toContain("R$");
  });

  it("omite localização quando cidade e bairro estão ausentes", () => {
    const text = buildPropertyShareText({
      title: "Terreno",
      price: null,
      showPrice: false,
      city: null,
      neighborhood: null,
    });
    expect(text).toBe("Terreno");
  });

  it("usa apenas a cidade quando o bairro está ausente", () => {
    const text = buildPropertyShareText({
      title: "Sítio",
      price: null,
      showPrice: false,
      city: "Campinas",
      neighborhood: null,
    });
    expect(text).toContain("Campinas");
    expect(text).not.toContain(", Campinas");
  });
});

describe("buildCatalogShareText", () => {
  it("inclui o nome profissional do corretor", () => {
    expect(buildCatalogShareText("Maria Silva Imóveis")).toContain("Maria Silva Imóveis");
  });
});
