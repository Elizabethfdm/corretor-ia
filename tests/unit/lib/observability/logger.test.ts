import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/observability/logger";

describe("logger", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("LOG_LEVEL", "debug");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("emite log estruturado em JSON com nível, mensagem e timestamp", () => {
    logger.info("evento de teste", { propertyId: "abc-123" });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;

    expect(entry).toMatchObject({
      level: "info",
      message: "evento de teste",
      propertyId: "abc-123",
    });
    expect(typeof entry["timestamp"]).toBe("string");
  });

  it("redige campos sensíveis (RNF-036) em vez de logá-los em texto puro", () => {
    logger.info("tentativa de login", {
      email: "corretor@example.com",
      password: "senha-super-secreta",
      token: "abc.def.ghi",
    });

    const entry = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;

    expect(entry["password"]).toBe("[REDACTED]");
    expect(entry["token"]).toBe("[REDACTED]");
    expect(entry["email"]).toBe("corretor@example.com");
  });

  it("usa console.error para logs de nível error", () => {
    logger.error("falha inesperada");

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("não emite logs abaixo do nível mínimo configurado", () => {
    vi.stubEnv("LOG_LEVEL", "warn");

    logger.debug("não deveria aparecer");
    logger.info("também não deveria aparecer");

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
