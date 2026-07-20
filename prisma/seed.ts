import "dotenv/config";
import { prisma } from "@/lib/database/prisma";

/**
 * Seed determinístico do banco de dados local/teste.
 * Nenhum modelo de domínio existe ainda (Fase 1 — Fundação do Projeto).
 * A partir da Fase 2 (Autenticação), este script passará a criar os
 * dados de teste descritos em docs/quality/test-strategy.md (corretor A,
 * corretor B, administrador, imóveis de exemplo etc.), sempre com dados
 * fictícios e determinísticos — nunca dados pessoais reais.
 */
async function main() {
  console.log("Nenhum dado de domínio para semear ainda (Fase 1).");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
