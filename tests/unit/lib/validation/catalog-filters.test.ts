import { describe, expect, it } from "vitest";
import { buildCatalogQueryString, parseCatalogFilters } from "@/lib/validation/catalog-filters";

describe("parseCatalogFilters", () => {
  it("aceita searchParams vazio, com valores padrão", () => {
    const filters = parseCatalogFilters({});
    expect(filters.sort).toBe("recent");
    expect(filters.page).toBe(1);
    expect(filters.q).toBeUndefined();
  });

  it("converte campos de texto simples", () => {
    const filters = parseCatalogFilters({ q: "piscina", city: "São Paulo" });
    expect(filters.q).toBe("piscina");
    expect(filters.city).toBe("São Paulo");
  });

  it("converte enums válidos", () => {
    const filters = parseCatalogFilters({ purpose: "RENT", type: "APARTMENT" });
    expect(filters.purpose).toBe("RENT");
    expect(filters.type).toBe("APARTMENT");
  });

  it("ignora enum inválido sem derrubar o parse inteiro (RN-047 — URL adulterada)", () => {
    const filters = parseCatalogFilters({ purpose: "ALUGUEL_INVALIDO", city: "Recife" });
    expect(filters.purpose).toBeUndefined();
    expect(filters.city).toBe("Recife");
  });

  it("coage campos numéricos vindos como string", () => {
    const filters = parseCatalogFilters({
      priceMin: "100000",
      priceMax: "500000",
      bedroomsMin: "2",
      parkingMin: "1",
    });
    expect(filters.priceMin).toBe(100000);
    expect(filters.priceMax).toBe(500000);
    expect(filters.bedroomsMin).toBe(2);
    expect(filters.parkingMin).toBe(1);
  });

  it("ignora número inválido sem derrubar o parse inteiro", () => {
    const filters = parseCatalogFilters({ priceMin: "não-é-número" });
    expect(filters.priceMin).toBeUndefined();
  });

  it("normaliza financingAccepted apenas quando 'true'", () => {
    expect(parseCatalogFilters({ financingAccepted: "true" }).financingAccepted).toBe(true);
    expect(parseCatalogFilters({ financingAccepted: "false" }).financingAccepted).toBeUndefined();
    expect(parseCatalogFilters({}).financingAccepted).toBeUndefined();
  });

  it("converte features em array mesmo quando um único valor é enviado", () => {
    const single = parseCatalogFilters({ features: "POOL" });
    expect(single.features).toEqual(["POOL"]);

    const multiple = parseCatalogFilters({ features: ["POOL", "GARDEN"] });
    expect(multiple.features).toEqual(["POOL", "GARDEN"]);
  });

  it("ignora valor de característica fora do enum", () => {
    const filters = parseCatalogFilters({ features: ["POOL", "SAUNA_INFINITA"] });
    expect(filters.features).toBeUndefined();
  });

  it("usa 'recent' e página 1 como padrão quando ausentes ou inválidos", () => {
    expect(parseCatalogFilters({ sort: "ordenacao-invalida" }).sort).toBe("recent");
    expect(parseCatalogFilters({ page: "0" }).page).toBe(1);
    expect(parseCatalogFilters({ page: "abc" }).page).toBe(1);
  });
});

describe("buildCatalogQueryString", () => {
  it("retorna string vazia quando não há filtros ativos", () => {
    const filters = parseCatalogFilters({});
    expect(buildCatalogQueryString(filters)).toBe("");
  });

  it("inclui filtros ativos na query string", () => {
    const filters = parseCatalogFilters({ city: "Recife", bedroomsMin: "2" });
    const query = buildCatalogQueryString(filters);
    expect(query).toContain("city=Recife");
    expect(query).toContain("bedroomsMin=2");
  });

  it("omite sort='recent' e page=1 por serem os padrões", () => {
    const filters = parseCatalogFilters({ city: "Recife" });
    const query = buildCatalogQueryString(filters);
    expect(query).not.toContain("sort=");
    expect(query).not.toContain("page=");
  });

  it("aplica overrides preservando os demais filtros (paginação)", () => {
    const filters = parseCatalogFilters({ city: "Recife", sort: "price_asc" });
    const query = buildCatalogQueryString(filters, { page: 2 });
    expect(query).toContain("city=Recife");
    expect(query).toContain("sort=price_asc");
    expect(query).toContain("page=2");
  });

  it("repete o parâmetro para cada valor de um array (features)", () => {
    const filters = parseCatalogFilters({ features: ["POOL", "GARDEN"] });
    const query = buildCatalogQueryString(filters);
    const params = new URLSearchParams(query);
    expect(params.getAll("features")).toEqual(["POOL", "GARDEN"]);
  });
});
