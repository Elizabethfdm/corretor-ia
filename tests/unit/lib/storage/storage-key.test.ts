import { describe, expect, it } from "vitest";
import { generateStorageKey } from "@/lib/storage/storage-key";

describe("generateStorageKey (RN-036)", () => {
  it("gera uma chave com o prefixo, um identificador aleatório e a extensão informados", () => {
    const key = generateStorageKey("broker/user-123/photo", "jpg");
    expect(key).toMatch(
      /^broker\/user-123\/photo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    );
  });

  it("gera chaves diferentes a cada chamada, mesmo com os mesmos parâmetros", () => {
    const a = generateStorageKey("broker/user-123/photo", "jpg");
    const b = generateStorageKey("broker/user-123/photo", "jpg");
    expect(a).not.toBe(b);
  });

  it("nunca reaproveita o nome original do arquivo (a chave não recebe nome como argumento)", () => {
    const key = generateStorageKey("broker/user-123/logo", "png");
    expect(key.startsWith("broker/user-123/logo/")).toBe(true);
    expect(key.endsWith(".png")).toBe(true);
  });
});
