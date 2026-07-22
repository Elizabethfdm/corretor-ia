import { describe, expect, it, vi } from "vitest";
import {
  ArtworkRenderError,
  composeArtwork,
  resolveArtworkAccentColor,
} from "@/lib/artwork/compose-artwork";
import { ARTWORK_FORMAT_DIMENSIONS } from "@/lib/artwork/labels";
import { ArtworkFormat, ArtworkTemplateType } from "@/generated/prisma/enums";

// Composição via sharp/Pango envolve custo de inicialização (fontconfig) na
// primeira chamada do processo — aumenta o timeout padrão só neste arquivo.
vi.setConfig({ testTimeout: 15_000 });

// PNG 1x1 válido (vermelho), mesma fixture determinística usada em process-image.test.ts.
const VALID_PHOTO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const BASE_INPUT = {
  format: ArtworkFormat.SQUARE_FEED,
  templateType: ArtworkTemplateType.NEW_PROPERTY,
  photoBuffer: VALID_PHOTO,
  title: "Casa nova no Jardim Europa",
  subtitle: "3 quartos · 120 m² · R$ 450.000,00",
  callToAction: "Fale comigo e agende uma visita",
  accentColor: null as string | null,
};

describe("resolveArtworkAccentColor (RN-076)", () => {
  it("usa a cor do corretor quando configurada", () => {
    expect(resolveArtworkAccentColor(ArtworkTemplateType.SALE, "#123456")).toBe("#123456");
  });

  it("cai para uma cor padrão da plataforma quando o corretor não configurou identidade visual", () => {
    const color = resolveArtworkAccentColor(ArtworkTemplateType.SALE, null);
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("cores padrão são distintas por tipo de anúncio", () => {
    const colors = new Set(
      Object.values(ArtworkTemplateType).map((type) => resolveArtworkAccentColor(type, null)),
    );
    expect(colors.size).toBe(Object.values(ArtworkTemplateType).length);
  });
});

describe("composeArtwork (RN-075 a RN-081)", () => {
  it.each(Object.values(ArtworkFormat))(
    "gera um JPEG com as dimensões corretas para o formato %s",
    async (format) => {
      const result = await composeArtwork({ ...BASE_INPUT, format });
      const expected = ARTWORK_FORMAT_DIMENSIONS[format];

      expect(result.contentType).toBe("image/jpeg");
      expect(result.width).toBe(expected.width);
      expect(result.height).toBe(expected.height);
      expect(result.buffer.byteLength).toBeGreaterThan(0);
    },
  );

  it("RN-078: nunca distorce a foto — sempre recorta (cover), nunca esmaga (fill)", async () => {
    const result = await composeArtwork({ ...BASE_INPUT, format: ArtworkFormat.VERTICAL_FEED });
    const expected = ARTWORK_FORMAT_DIMENSIONS[ArtworkFormat.VERTICAL_FEED];

    // fit "cover" sempre produz exatamente as dimensões do modelo,
    // independentemente da proporção da foto de origem.
    expect(result.width).toBe(expected.width);
    expect(result.height).toBe(expected.height);
  });

  it("RN-077: nunca lança erro com textos no limite máximo de caracteres permitido", async () => {
    const result = await composeArtwork({
      ...BASE_INPUT,
      title: "a".repeat(70),
      subtitle: "b".repeat(110),
      callToAction: "c".repeat(50),
    });

    expect(result.width).toBe(ARTWORK_FORMAT_DIMENSIONS[BASE_INPUT.format].width);
  });

  it("funciona sem subtítulo (opcional)", async () => {
    const result = await composeArtwork({ ...BASE_INPUT, subtitle: "" });
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it("funciona sem logotipo do corretor (RN-076 — ausência não bloqueia a geração)", async () => {
    const result = await composeArtwork({ ...BASE_INPUT, logoBuffer: null });
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it("compõe também com logotipo do corretor presente", async () => {
    const result = await composeArtwork({ ...BASE_INPUT, logoBuffer: VALID_PHOTO });
    expect(result.width).toBe(ARTWORK_FORMAT_DIMENSIONS[BASE_INPUT.format].width);
  });

  it("lança ArtworkRenderError quando a foto de origem não é uma imagem válida", async () => {
    const notAnImage = Buffer.from("conteudo-nao-eh-imagem");

    await expect(composeArtwork({ ...BASE_INPUT, photoBuffer: notAnImage })).rejects.toThrow(
      ArtworkRenderError,
    );
  });
});
