import { describe, expect, it } from "vitest";
import { fieldErrorsFromZod } from "@/features/auth/action-state";
import { registerSchema } from "@/lib/validation/auth";

describe("fieldErrorsFromZod", () => {
  it("agrupa mensagens de erro por campo, no formato usado pelos formulários", () => {
    const result = registerSchema.safeParse({
      fullName: "",
      email: "invalido",
      password: "123",
      confirmPassword: "456",
      termsAccepted: false,
      privacyAccepted: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const fieldErrors = fieldErrorsFromZod(result.error);

    expect(fieldErrors["fullName"]).toBeDefined();
    expect(fieldErrors["email"]).toBeDefined();
    expect(fieldErrors["password"]).toBeDefined();
    expect(fieldErrors["termsAccepted"]).toBeDefined();
    expect(fieldErrors["privacyAccepted"]).toBeDefined();
  });

  it("associa erros de .refine() ao campo indicado em path", () => {
    const result = registerSchema.safeParse({
      fullName: "Maria Silva",
      email: "maria@example.com",
      password: "senha1234",
      confirmPassword: "outraSenha1",
      termsAccepted: true,
      privacyAccepted: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const fieldErrors = fieldErrorsFromZod(result.error);
    expect(fieldErrors["confirmPassword"]).toContain(
      "A confirmação de senha não coincide com a senha.",
    );
  });
});
