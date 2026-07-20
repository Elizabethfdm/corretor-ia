import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { CORRELATION_ID_HEADER, resolveCorrelationId } from "@/lib/observability/correlation-id";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * Health check (RNF-038). Verifica se a aplicação está no ar e se a
 * conexão com o banco de dados está disponível (readiness). Não expõe
 * detalhes internos em caso de falha (RNF-040).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const correlationId = resolveCorrelationId(request.headers.get(CORRELATION_ID_HEADER));
  const startedAt = Date.now();

  let databaseStatus: "up" | "down" = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = "down";
    logger.error("Falha ao verificar conexão com o banco de dados no health check", {
      correlationId,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
  }

  const healthy = databaseStatus === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database: databaseStatus,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { [CORRELATION_ID_HEADER]: correlationId },
    },
  );
}
