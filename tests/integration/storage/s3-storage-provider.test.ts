import { describe, expect, it } from "vitest";
import { getStorageProvider, generateStorageKey } from "@/lib/storage";

describe("S3StorageProvider (MinIO local — ADR-0003)", () => {
  it("envia um objeto, disponibiliza leitura pública e permite excluir", async () => {
    const provider = getStorageProvider();
    const key = generateStorageKey("test/integration", "txt");
    const body = Buffer.from("conteúdo de teste");

    const uploaded = await provider.upload({ key, body, contentType: "text/plain" });

    expect(uploaded.key).toBe(key);
    expect(uploaded.size).toBe(body.length);

    const response = await fetch(uploaded.publicUrl);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("conteúdo de teste");

    await provider.delete(key);

    const afterDelete = await fetch(uploaded.publicUrl);
    expect(afterDelete.status).toBe(404);
  });

  it("keyFromPublicUrl recupera a chave original a partir da publicUrl", () => {
    const provider = getStorageProvider();
    const key = generateStorageKey("test/integration", "jpg");
    const publicUrl = `${process.env["STORAGE_PUBLIC_BASE_URL"]}/${key}`;

    expect(provider.keyFromPublicUrl(publicUrl)).toBe(key);
  });
});
