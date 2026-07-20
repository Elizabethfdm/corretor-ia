import "dotenv/config";
import { Client } from "pg";
import type { APIRequestContext } from "@playwright/test";

const APP_URL = process.env["APP_URL"] ?? "http://localhost:3000";

export function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

interface CreateTestUserInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Cria um usuário diretamente pela API (sem passar pela UI) para
 * preparar cenários de teste E2E que não estão testando o próprio
 * cadastro (ex.: login, proteção de rotas).
 */
export async function createTestUser(
  request: APIRequestContext,
  input: CreateTestUserInput,
): Promise<{ id: string; email: string }> {
  const response = await request.post("/api/auth/sign-up/email", {
    headers: { origin: APP_URL },
    data: input,
  });

  if (!response.ok()) {
    throw new Error(
      `Falha ao criar usuário de teste: ${response.status()} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { user: { id: string; email: string } };
  return body.user;
}

/**
 * Remove um usuário de teste (e o respectivo broker_profile, se
 * existir — não há FK/cascade entre as tabelas, ver
 * docs/architecture/data-model.md) via SQL direto (pg), em vez do
 * cliente Prisma gerado: o gerador "prisma-client" produz um módulo ESM
 * (usa import.meta), incompatível com o carregador de módulos do runner
 * de testes do Playwright. Usar "pg" diretamente evita esse conflito
 * sem exigir mudança na configuração de módulos do projeto inteiro.
 */
export async function deleteTestUserByEmail(email: string): Promise<void> {
  const client = new Client({ connectionString: process.env["DATABASE_URL"] });
  await client.connect();
  try {
    const result = await client.query<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [
      email,
    ]);
    const userId = result.rows[0]?.id;
    if (userId) {
      await client.query('DELETE FROM "broker_profile" WHERE "userId" = $1', [userId]);
    }
    await client.query('DELETE FROM "user" WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
}
