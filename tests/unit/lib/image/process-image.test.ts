import { describe, expect, it } from "vitest";
import { processImage, UnsupportedImageFormatError } from "@/lib/image/process-image";

// PNG 1x1 válido (vermelho), usado como fixture determinística.
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("processImage (RN-024, RN-035, RN-037)", () => {
  it("converte uma imagem válida para JPEG", async () => {
    const result = await processImage(VALID_PNG, { maxWidth: 512, maxHeight: 512 });

    expect(result.contentType).toBe("image/jpeg");
    expect(result.buffer.byteLength).toBeGreaterThan(0);
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBeLessThanOrEqual(512);
  });

  it("rejeita um arquivo que não é uma imagem (RN-035 — validação pelo conteúdo real)", async () => {
    const fakeExecutable = Buffer.from("MZ\x90\x00\x03\x00\x00\x00conteudo-nao-eh-imagem");

    await expect(processImage(fakeExecutable, { maxWidth: 512, maxHeight: 512 })).rejects.toThrow(
      UnsupportedImageFormatError,
    );
  });

  it("rejeita SVG (vetor de XSS via <script> embutido)", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );

    await expect(processImage(svg, { maxWidth: 512, maxHeight: 512 })).rejects.toThrow(
      UnsupportedImageFormatError,
    );
  });

  it("nunca preserva metadados originais na saída (RN-037)", async () => {
    const result = await processImage(VALID_PNG, { maxWidth: 512, maxHeight: 512 });

    const sharp = (await import("sharp")).default;
    const outputMetadata = await sharp(result.buffer).metadata();

    expect(outputMetadata.exif).toBeUndefined();
  });
});
