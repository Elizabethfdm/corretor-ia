import { ConsoleEmailProvider } from "@/lib/email/providers/console-email-provider";
import type { EmailProvider } from "@/lib/email/types";

export type { EmailMessage, EmailProvider } from "@/lib/email/types";

let cachedProvider: EmailProvider | undefined;

/**
 * Seleciona o provedor de e-mail via EMAIL_PROVIDER (ADR-0005). Nenhum
 * provedor de produção está implementado ainda — apenas "console"
 * (padrão), usado em desenvolvimento e testes.
 */
export function getEmailProvider(): EmailProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = process.env["EMAIL_PROVIDER"] ?? "console";

  if (provider !== "console") {
    throw new Error(
      `Provedor de e-mail "${provider}" não implementado. Apenas "console" está disponível nesta fase (ver ADR-0005).`,
    );
  }

  cachedProvider = new ConsoleEmailProvider();
  return cachedProvider;
}
