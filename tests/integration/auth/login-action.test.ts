import { afterEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { loginAction } from "@/features/auth/actions";

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

describe("loginAction", () => {
  it("autentica, registra auditoria e redireciona para /painel", async () => {
    const email = uniqueEmail("login-action-ok");
    await auth.api.signUpEmail({ body: { name: "Corretor", email, password: "senha1234" } });

    let redirectedTo: string | undefined;
    try {
      await loginAction({ status: "idle" }, formData({ email, password: "senha1234" }));
    } catch (error) {
      if (!isNextRedirect(error)) throw error;
      redirectedTo = error.digest;
    }

    expect(redirectedTo).toContain("/painel");

    const user = await prisma.user.findUnique({ where: { email } });
    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: "USER_LOGIN", entityId: user?.id },
    });
    expect(auditEntry).not.toBeNull();
  });

  it("retorna mensagem genérica para senha incorreta (RN-007)", async () => {
    const email = uniqueEmail("login-action-wrong-pwd");
    await auth.api.signUpEmail({ body: { name: "Corretor", email, password: "senha1234" } });

    const result = await loginAction(
      { status: "idle" },
      formData({ email, password: "senhaErrada1" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toBe("E-mail ou senha inválidos.");
  });

  it("retorna a mesma mensagem genérica para e-mail inexistente (sem revelar que não existe)", async () => {
    const result = await loginAction(
      { status: "idle" },
      formData({ email: "inexistente-login-action@example.com", password: "qualquerSenha1" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toBe("E-mail ou senha inválidos.");
  });

  it("valida o formato do e-mail antes de chamar o provedor de autenticação", async () => {
    const result = await loginAction(
      { status: "idle" },
      formData({ email: "formato-invalido", password: "qualquerSenha1" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.["email"]).toBeDefined();
  });
});
