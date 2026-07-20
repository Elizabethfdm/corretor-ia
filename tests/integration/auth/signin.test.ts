import { afterEach, describe, expect, it } from "vitest";
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

describe("Login (auth.api.signInEmail)", () => {
  it("autentica com credenciais corretas", async () => {
    const email = uniqueEmail("signin-ok");
    await auth.api.signUpEmail({ body: { name: "Maria Silva", email, password: "senha1234" } });

    const result = await auth.api.signInEmail({ body: { email, password: "senha1234" } });

    expect(result.user.email).toBe(email);
  });

  it("rejeita senha incorreta (RN-007: sem detalhar o motivo na exceção pública)", async () => {
    const email = uniqueEmail("signin-wrong-pwd");
    await auth.api.signUpEmail({ body: { name: "Maria Silva", email, password: "senha1234" } });

    await expect(
      auth.api.signInEmail({ body: { email, password: "senhaErrada1" } }),
    ).rejects.toThrow();
  });

  it("rejeita login para e-mail inexistente", async () => {
    await expect(
      auth.api.signInEmail({
        body: { email: "nao-existe-jamais@example.com", password: "senha1234" },
      }),
    ).rejects.toThrow();
  });
});

describe("Bloqueio de conta (RN-006)", () => {
  // Nota: a revogação automática de sessões existentes ao bloquear uma
  // conta (RN-092) é um efeito colateral do endpoint administrativo
  // auth.api.banUser (que exige uma sessão de administrador autenticada
  // — a ser exercitado quando o painel administrativo for implementado).
  // Este teste cobre a garantia mais fundamental, independente de como
  // o campo é alterado: nenhum usuário com banned=true consegue
  // autenticar.
  it("impede login de uma conta marcada como bloqueada (banned)", async () => {
    const email = uniqueEmail("signin-banned");
    const signUp = await auth.api.signUpEmail({
      body: { name: "Corretor Bloqueado", email, password: "senha1234" },
    });

    await prisma.user.update({
      where: { id: signUp.user.id },
      data: { banned: true, banReason: "Teste automatizado" },
    });

    await expect(
      auth.api.signInEmail({ body: { email, password: "senha1234" } }),
    ).rejects.toThrow();
  });
});
