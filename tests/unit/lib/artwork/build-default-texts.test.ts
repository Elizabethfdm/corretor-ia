import { describe, expect, it } from "vitest";
import {
  buildDefaultArtworkCallToAction,
  buildDefaultArtworkSubtitle,
} from "@/lib/artwork/build-default-texts";
import { formatCurrencyBRL } from "@/lib/money/format-currency";

describe("buildDefaultArtworkSubtitle (RF-063)", () => {
  it("combina quartos, área e preço quando disponíveis", () => {
    const subtitle = buildDefaultArtworkSubtitle({
      bedrooms: 3,
      totalArea: "120",
      price: "450000",
      showPrice: true,
    });

    expect(subtitle).toBe(`3 quartos · 120 m² · ${formatCurrencyBRL("450000")}`);
  });

  it("nunca inclui preço quando showPrice é falso (RN-075)", () => {
    const subtitle = buildDefaultArtworkSubtitle({
      bedrooms: 2,
      totalArea: null,
      price: "450000",
      showPrice: false,
    });

    expect(subtitle).toBe("2 quartos");
    expect(subtitle).not.toContain("R$");
  });

  it("nunca inclui um campo vazio/nulo na composição", () => {
    const subtitle = buildDefaultArtworkSubtitle({
      bedrooms: null,
      totalArea: null,
      price: null,
      showPrice: true,
    });

    expect(subtitle).toBe("");
  });
});

describe("buildDefaultArtworkCallToAction (RF-063)", () => {
  it("retorna um texto padrão não vazio", () => {
    expect(buildDefaultArtworkCallToAction().length).toBeGreaterThan(0);
  });
});
