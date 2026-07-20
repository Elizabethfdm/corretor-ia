import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";

const testEmails: string[] = [];

function uniqueEmail(label: string): string {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  testEmails.push(email);
  return email;
}

afterEach(async () => {
  if (testEmails.length > 0) {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("Cadastro (auth.api.signUpEmail)", () => {
  it("cria um usuário com papel broker e aceites carimbados automaticamente (RN-011)", async () => {
    const email = uniqueEmail("signup-ok");

    const result = await auth.api.signUpEmail({
      body: { name: "Maria Silva", email, password: "senha1234" },
    });

    expect(result.user.email).toBe(email);
    expect(result.user.role).toBe("broker");
    expect(result.user.banned).toBe(false);
    expect(result.user.termsAcceptedAt).not.toBeNull();
    expect(result.user.privacyAcceptedAt).not.toBeNull();
  });

  it("nunca armazena a senha em texto puro (RN-005)", async () => {
    const email = uniqueEmail("signup-hash");
    const plainPassword = "senha1234";

    const result = await auth.api.signUpEmail({
      body: { name: "Maria Silva", email, password: plainPassword },
    });

    const account = await prisma.account.findFirst({
      where: { userId: result.user.id, providerId: "credential" },
    });

    expect(account?.password).toBeDefined();
    expect(account?.password).not.toBe(plainPassword);
    expect(account?.password?.includes(plainPassword)).toBe(false);
  });

  it("rejeita cadastro com e-mail já utilizado", async () => {
    const email = uniqueEmail("signup-dup");

    await auth.api.signUpEmail({
      body: { name: "Primeiro Cadastro", email, password: "senha1234" },
    });

    await expect(
      auth.api.signUpEmail({
        body: { name: "Segundo Cadastro", email, password: "outraSenha1" },
      }),
    ).rejects.toThrow();
  });
});

describe("Isolamento entre contas (RN-013)", () => {
  let emailA: string;
  let emailB: string;

  beforeEach(() => {
    emailA = uniqueEmail("broker-a");
    emailB = uniqueEmail("broker-b");
  });

  it("cada conta recebe um identificador próprio, sem reaproveitar dados de outra", async () => {
    const brokerA = await auth.api.signUpEmail({
      body: { name: "Corretor A", email: emailA, password: "senha1234" },
    });
    const brokerB = await auth.api.signUpEmail({
      body: { name: "Corretor B", email: emailB, password: "senha5678" },
    });

    expect(brokerA.user.id).not.toBe(brokerB.user.id);

    const userAInDb = await prisma.user.findUniqueOrThrow({ where: { id: brokerA.user.id } });
    expect(userAInDb.email).toBe(emailA);
    expect(userAInDb.email).not.toBe(emailB);
  });
});
