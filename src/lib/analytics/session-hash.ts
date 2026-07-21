import { createHash } from "node:crypto";

/**
 * RN-084, RN-087: identifica uma "sessão" sem cookie — hash não
 * reversível de IP + User-Agent + dia-calendário (ver ADR-0007). Nunca
 * grava o IP em si, só o hash.
 */
export function computeSessionHash(
  ip: string,
  userAgent: string,
  referenceDate: Date = new Date(),
): string {
  const dayBucket = referenceDate.toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${userAgent}|${dayBucket}`).digest("hex");
}

/**
 * `x-forwarded-for` pode conter uma lista "cliente, proxy1, proxy2" —
 * o primeiro valor é o mais próximo do cliente original. Sem proxy
 * (ambiente local), não há cabeçalho — usa um valor fixo não-vazio para
 * que o hash ainda seja determinístico dentro do mesmo dia.
 */
export function resolveClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return "unknown";
}
