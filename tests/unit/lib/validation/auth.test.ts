import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

const validRegisterInput = {
  fullName: "Maria Silva",
  email: "maria@example.com",
  password: "senha1234",
  confirmPassword: "senha1234",
  termsAccepted: true,
  privacyAccepted: true,
};

describe("registerSchema", () => {
  it("aceita um cadastro válido (RN-001 a RN-005, RN-011)", () => {
    const result = registerSchema.safeParse(validRegisterInput);
    expect(result.success).toBe(true);
  });

  it("normaliza o e-mail para minúsculas e remove espaços", () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      email: "  Maria@Example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("maria@example.com");
    }
  });

  it("rejeita e-mail com formato inválido (RN-002)", () => {
    const result = registerSchema.safeParse({ ...validRegisterInput, email: "não-é-email" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres (RN-003)", () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      password: "abc123",
      confirmPassword: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem nenhum número (RN-003 — combinação mínima)", () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      password: "somenteletras",
      confirmPassword: "somenteletras",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem nenhuma letra (RN-003 — combinação mínima)", () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando a confirmação de senha não coincide (RN-004)", () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      confirmPassword: "outraSenha1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((issue) =>
        issue.path.includes("confirmPassword"),
      );
      expect(confirmError).toBeDefined();
    }
  });

  it("rejeita cadastro sem aceite dos Termos de Uso (RN-011)", () => {
    const result = registerSchema.safeParse({ ...validRegisterInput, termsAccepted: false });
    expect(result.success).toBe(false);
  });

  it("rejeita cadastro sem aceite da Política de Privacidade (RN-011)", () => {
    const result = registerSchema.safeParse({ ...validRegisterInput, privacyAccepted: false });
    expect(result.success).toBe(false);
  });

  it("rejeita nome completo vazio", () => {
    const result = registerSchema.safeParse({ ...validRegisterInput, fullName: "  " });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita credenciais com formato válido", () => {
    const result = loginSchema.safeParse({ email: "maria@example.com", password: "qualquer" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = loginSchema.safeParse({ email: "invalido", password: "qualquer" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({ email: "maria@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("aceita um e-mail válido", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "maria@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "invalido" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validInput = {
    token: "token-valido",
    newPassword: "novaSenha1",
    confirmNewPassword: "novaSenha1",
  };

  it("aceita uma redefinição válida", () => {
    expect(resetPasswordSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejeita quando as senhas não coincidem", () => {
    const result = resetPasswordSchema.safeParse({
      ...validInput,
      confirmNewPassword: "outraSenha1",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita token vazio", () => {
    const result = resetPasswordSchema.safeParse({ ...validInput, token: "" });
    expect(result.success).toBe(false);
  });
});
