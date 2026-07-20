import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/database/prisma";
import { registerAction } from "@/features/auth/actions";

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

interface NextRedirectError {
  digest: string;
}

function isNextRedirect(error: unknown): error is NextRedirectError {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as NextRedirectError).digest === "string" &&
    (error as NextRedirectError).digest.startsWith("NEXT_REDIRECT")
  );
}

afterEach(async () => {
  if (testEmails.length > 0) {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("registerAction", () => {
  it("cadastra o usuário, registra auditoria e redireciona para /painel", async () => {
    const email = uniqueEmail("register-action-ok");

    let redirectedTo: string | undefined;
    try {
      await registerAction(
        { status: "idle" },
        formData({
          fullName: "Maria Silva",
          email,
          password: "senha1234",
          confirmPassword: "senha1234",
          termsAccepted: "on",
          privacyAccepted: "on",
        }),
      );
    } catch (error) {
      if (!isNextRedirect(error)) throw error;
      redirectedTo = error.digest;
    }

    expect(redirectedTo).toContain("/painel");

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: "USER_REGISTERED", entityId: user?.id },
    });
    expect(auditEntry).not.toBeNull();
  });

  it("não cadastra e retorna erros de campo quando os termos não são aceitos (RN-011)", async () => {
    const email = uniqueEmail("register-action-no-terms");

    const result = await registerAction(
      { status: "idle" },
      formData({
        fullName: "Maria Silva",
        email,
        password: "senha1234",
        confirmPassword: "senha1234",
        termsAccepted: "",
        privacyAccepted: "on",
      }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.["termsAccepted"]).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });

  it("retorna erro genérico ao tentar cadastrar com e-mail já existente", async () => {
    const email = uniqueEmail("register-action-dup");

    const validPayload = {
      fullName: "Maria Silva",
      email,
      password: "senha1234",
      confirmPassword: "senha1234",
      termsAccepted: "on",
      privacyAccepted: "on",
    };

    try {
      await registerAction({ status: "idle" }, formData(validPayload));
    } catch (error) {
      if (!isNextRedirect(error)) throw error;
    }

    const result = await registerAction({ status: "idle" }, formData(validPayload));

    expect(result.status).toBe("error");
    expect(result.message).toBeTruthy();
  });
});
