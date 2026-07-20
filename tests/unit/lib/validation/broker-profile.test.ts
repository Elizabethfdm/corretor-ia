import { describe, expect, it } from "vitest";
import {
  brokerProfileSchema,
  getPublicationRequirementErrors,
  slugSchema,
} from "@/lib/validation/broker-profile";

describe("slugSchema", () => {
  it("aceita um slug válido", () => {
    expect(slugSchema.safeParse("maria-silva-imoveis").success).toBe(true);
  });

  it("normaliza para minúsculas", () => {
    const result = slugSchema.safeParse("Maria-Silva");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("maria-silva");
  });

  it("rejeita caracteres não permitidos (RN-019)", () => {
    expect(slugSchema.safeParse("maria_silva").success).toBe(false);
    expect(slugSchema.safeParse("maria silva").success).toBe(false);
    expect(slugSchema.safeParse("maria.silva").success).toBe(false);
    expect(slugSchema.safeParse("MARIA-SILVA!").success).toBe(false);
  });

  it("rejeita slug menor que 3 caracteres", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
  });

  it.each(["admin", "login", "api", "app", "suporte", "configuracoes", "catalogo", "painel"])(
    "rejeita a palavra reservada '%s' (RN-020)",
    (reserved) => {
      expect(slugSchema.safeParse(reserved).success).toBe(false);
    },
  );
});

const validProfileInput = {
  professionalName: "Maria Silva Imóveis",
  fullName: "Maria da Silva",
  slug: "maria-silva-imoveis",
};

describe("brokerProfileSchema", () => {
  it("aceita um perfil mínimo válido (demais campos opcionais)", () => {
    const result = brokerProfileSchema.safeParse(validProfileInput);
    expect(result.success).toBe(true);
  });

  it("rejeita nome profissional vazio (RN-015)", () => {
    const result = brokerProfileSchema.safeParse({ ...validProfileInput, professionalName: "" });
    expect(result.success).toBe(false);
  });

  it("converte campos de texto opcionais vazios em undefined", () => {
    const result = brokerProfileSchema.safeParse({ ...validProfileInput, city: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.city).toBeUndefined();
  });

  it("normaliza a UF do CRECI para maiúsculas", () => {
    const result = brokerProfileSchema.safeParse({ ...validProfileInput, creciState: "sp" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.creciState).toBe("SP");
  });

  it("rejeita UF com formato inválido", () => {
    const result = brokerProfileSchema.safeParse({ ...validProfileInput, creciState: "SPX" });
    expect(result.success).toBe(false);
  });

  it("aceita string vazia para UF opcional, como enviado por um <input> em branco via FormData", () => {
    // Regressão: FormData.get() de um campo de texto vazio retorna "",
    // não undefined — diferente de simplesmente omitir a chave do objeto.
    const result = brokerProfileSchema.safeParse({
      ...validProfileInput,
      creciState: "",
      state: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creciState).toBeUndefined();
      expect(result.data.state).toBeUndefined();
    }
  });

  it("aceita null para UF opcional, como retornado por FormData.get em campo ausente", () => {
    const result = brokerProfileSchema.safeParse({
      ...validProfileInput,
      creciState: null,
      state: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail comercial com formato inválido", () => {
    const result = brokerProfileSchema.safeParse({
      ...validProfileInput,
      commercialEmail: "invalido",
    });
    expect(result.success).toBe(false);
  });

  it("aceita cores em formato hexadecimal", () => {
    const result = brokerProfileSchema.safeParse({
      ...validProfileInput,
      primaryColor: "#1D4ED8",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita cor em formato inválido", () => {
    const result = brokerProfileSchema.safeParse({ ...validProfileInput, primaryColor: "azul" });
    expect(result.success).toBe(false);
  });

  it("rejeita URL de rede social inválida", () => {
    const result = brokerProfileSchema.safeParse({
      ...validProfileInput,
      instagramUrl: "nao-e-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("getPublicationRequirementErrors (RN-016 a RN-018)", () => {
  it("retorna vazio quando todos os campos obrigatórios de publicação estão presentes", () => {
    const errors = getPublicationRequirementErrors({
      creciNumber: "12345",
      creciState: "SP",
      whatsapp: "11999999999",
      city: "São Paulo",
    });
    expect(errors).toHaveLength(0);
  });

  it("lista todos os campos ausentes", () => {
    const errors = getPublicationRequirementErrors({});
    expect(errors).toHaveLength(4);
  });

  it("lista apenas os campos realmente ausentes", () => {
    const errors = getPublicationRequirementErrors({
      creciNumber: "12345",
      creciState: "SP",
    });
    expect(errors).toEqual(["Informe o WhatsApp.", "Informe a cidade de atuação."]);
  });
});
