import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/text/slugify";

describe("slugify", () => {
  it("converte para minúsculas e separa palavras por hífen", () => {
    expect(slugify("Casa com Piscina")).toBe("casa-com-piscina");
  });

  it("remove acentuação", () => {
    expect(slugify("Área Construída em São Paulo")).toBe("area-construida-em-sao-paulo");
  });

  it("remove pontuação e colapsa separadores múltiplos", () => {
    expect(slugify("Casa com Piscina - Jardim Europa!")).toBe("casa-com-piscina-jardim-europa");
  });

  it("remove hífens nas extremidades", () => {
    expect(slugify("  -Casa-  ")).toBe("casa");
  });

  it("trunca em 80 caracteres", () => {
    const longTitle = "a".repeat(200);
    expect(slugify(longTitle).length).toBe(80);
  });

  it("retorna string vazia para entrada sem caracteres alfanuméricos", () => {
    expect(slugify("!!!")).toBe("");
  });
});
