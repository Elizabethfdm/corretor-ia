import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";

describe("buildWhatsAppLink (RN-051)", () => {
  it("monta o link com o código do país quando ausente", () => {
    const link = buildWhatsAppLink("11999999999", "Olá");
    expect(link).toBe("https://wa.me/5511999999999?text=Ol%C3%A1");
  });

  it("não duplica o código do país quando já presente", () => {
    const link = buildWhatsAppLink("5511999999999", "Olá");
    expect(link).toBe("https://wa.me/5511999999999?text=Ol%C3%A1");
  });

  it("remove caracteres não numéricos do telefone", () => {
    const link = buildWhatsAppLink("(11) 99999-9999", "Oi");
    expect(link).toBe("https://wa.me/5511999999999?text=Oi");
  });

  it("preserva acentos e caracteres especiais via codificação de URL", () => {
    const link = buildWhatsAppLink("11999999999", "Olá! Código: A1-B2 & mais");
    const url = new URL(link);
    expect(url.searchParams.get("text")).toBe("Olá! Código: A1-B2 & mais");
  });
});
