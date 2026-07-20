import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleEmailProvider } from "@/lib/email/providers/console-email-provider";

describe("ConsoleEmailProvider", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("registra a mensagem de e-mail via logger em vez de enviar de verdade (ADR-0005)", async () => {
    const provider = new ConsoleEmailProvider();

    await provider.send({
      to: "corretor@example.com",
      subject: "Redefinição de senha",
      text: "Acesse o link para redefinir sua senha.",
    });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(entry["to"]).toBe("corretor@example.com");
    expect(entry["subject"]).toBe("Redefinição de senha");
  });
});
