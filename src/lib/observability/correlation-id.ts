import { randomUUID } from "node:crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";

/**
 * Reaproveita o identificador de correlação recebido na requisição
 * (quando presente e bem formado) ou gera um novo, conforme RNF-039.
 */
export function resolveCorrelationId(incomingHeaderValue: string | null): string {
  if (incomingHeaderValue && /^[a-zA-Z0-9-]{1,100}$/.test(incomingHeaderValue)) {
    return incomingHeaderValue;
  }
  return randomUUID();
}
