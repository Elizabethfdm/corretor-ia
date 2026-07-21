import { describe, expect, it } from "vitest";
import { computeSessionHash, resolveClientIp } from "@/lib/analytics/session-hash";

describe("computeSessionHash (RN-084, RN-087)", () => {
  const referenceDate = new Date("2026-07-21T10:00:00.000Z");

  it("é determinístico para o mesmo IP, User-Agent e dia", () => {
    const a = computeSessionHash("203.0.113.10", "Mozilla/5.0", referenceDate);
    const b = computeSessionHash("203.0.113.10", "Mozilla/5.0", referenceDate);
    expect(a).toBe(b);
  });

  it("nunca expõe o IP em texto claro no hash resultante", () => {
    const hash = computeSessionHash("203.0.113.10", "Mozilla/5.0", referenceDate);
    expect(hash).not.toContain("203.0.113.10");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("difere para IPs diferentes", () => {
    const a = computeSessionHash("203.0.113.10", "Mozilla/5.0", referenceDate);
    const b = computeSessionHash("203.0.113.11", "Mozilla/5.0", referenceDate);
    expect(a).not.toBe(b);
  });

  it("difere para User-Agents diferentes", () => {
    const a = computeSessionHash("203.0.113.10", "Mozilla/5.0", referenceDate);
    const b = computeSessionHash("203.0.113.10", "curl/8.0", referenceDate);
    expect(a).not.toBe(b);
  });

  it("difere em dias diferentes (janela de sessão renova por dia)", () => {
    const day1 = computeSessionHash("203.0.113.10", "Mozilla/5.0", new Date("2026-07-21T23:59:00.000Z"));
    const day2 = computeSessionHash("203.0.113.10", "Mozilla/5.0", new Date("2026-07-22T00:01:00.000Z"));
    expect(day1).not.toBe(day2);
  });
});

describe("resolveClientIp", () => {
  it("usa o primeiro valor de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(resolveClientIp(headers)).toBe("203.0.113.10");
  });

  it("retorna um valor fixo quando o cabeçalho está ausente (dev local sem proxy)", () => {
    const headers = new Headers();
    expect(resolveClientIp(headers)).toBe("unknown");
  });
});
