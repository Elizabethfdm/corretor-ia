import { describe, expect, it } from "vitest";
import { generateSlugWithSuffix } from "@/lib/text/generate-slug-with-suffix";

describe("generateSlugWithSuffix (RN-031)", () => {
  it("gera um slug com o título convertido e um sufixo hexadecimal de 6 caracteres", () => {
    const slug = generateSlugWithSuffix("Casa com Piscina - Jardim Europa!");
    expect(slug).toMatch(/^casa-com-piscina-jardim-europa-[0-9a-f]{6}$/);
  });

  it("gera sufixos diferentes a cada chamada, mesmo para o mesmo título", () => {
    const first = generateSlugWithSuffix("Apartamento Central");
    const second = generateSlugWithSuffix("Apartamento Central");
    expect(first).not.toBe(second);
  });

  it("usa o fallback quando o título não produz caracteres alfanuméricos", () => {
    const slug = generateSlugWithSuffix("!!!", "imovel");
    expect(slug).toMatch(/^imovel-[0-9a-f]{6}$/);
  });
});
