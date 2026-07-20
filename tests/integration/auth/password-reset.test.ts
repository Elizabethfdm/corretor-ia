import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { requestPasswordResetAction, resetPasswordAction } from "@/features/auth/actions";

const testEmails: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  return email;
}

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

afterEach(async () => {
  if (testEmails.length > 0) {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("Recuperação de senha — não enumeração (RN-014)", () => {
  it("retorna a mesma mensagem genérica para e-mail cadastrado e para e-mail inexistente", async () => {
    const email = uniqueEmail("reset-enum");
    await auth.api.signUpEmail({ body: { name: "Corretor", email, password: "senha1234" } });

    const resultExisting = await requestPasswordResetAction(
      { status: "idle" },
      formData({ email }),
    );
    const resultNonExisting = await requestPasswordResetAction(
      { status: "idle" },
      formData({ email: "jamais-cadastrado@example.com" }),
    );

    expect(resultExisting.status).toBe("success");
    expect(resultNonExisting.status).toBe("success");
    expect(resultExisting.message).toBe(resultNonExisting.message);
  });

  it("rejeita e-mail com formato inválido antes de chamar o provedor de auth", async () => {
    const result = await requestPasswordResetAction(
      { status: "idle" },
      formData({ email: "formato-invalido" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.["email"]).toBeDefined();
  });
});

describe("Redefinição de senha — fluxo completo", () => {
  it("permite login com a nova senha e invalida a senha antiga", async () => {
    const email = uniqueEmail("reset-flow");
    await auth.api.signUpEmail({ body: { name: "Corretor", email, password: "senhaAntiga1" } });

    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/redefinir-senha" } });

    const verification = await prisma.verification.findFirst({
      where: { identifier: { startsWith: "reset-password:" } },
      orderBy: { createdAt: "desc" },
    });
    const token = verification?.identifier.replace("reset-password:", "");
    expect(token).toBeTruthy();

    const resetResult = await resetPasswordAction(
      { status: "idle" },
      formData({
        token: token ?? "",
        newPassword: "senhaNova99",
        confirmNewPassword: "senhaNova99",
      }),
    );
    expect(resetResult.status).toBe("success");

    await expect(
      auth.api.signInEmail({ body: { email, password: "senhaAntiga1" } }),
    ).rejects.toThrow();

    const signInWithNewPassword = await auth.api.signInEmail({
      body: { email, password: "senhaNova99" },
    });
    expect(signInWithNewPassword.user.email).toBe(email);
  });

  it("retorna erro amigável para token inválido, sem lançar exceção não tratada", async () => {
    const result = await resetPasswordAction(
      { status: "idle" },
      formData({
        token: "token-que-nunca-existiu",
        newPassword: "senhaNova99",
        confirmNewPassword: "senhaNova99",
      }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toBeTruthy();
  });

  it("rejeita quando a confirmação de senha não coincide, sem chamar o provedor", async () => {
    const result = await resetPasswordAction(
      { status: "idle" },
      formData({
        token: "qualquer-token",
        newPassword: "senhaNova99",
        confirmNewPassword: "outraCoisa1",
      }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.["confirmNewPassword"]).toBeDefined();
  });
});
