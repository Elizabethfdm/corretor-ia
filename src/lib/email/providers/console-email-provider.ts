import { logger } from "@/lib/observability/logger";
import type { EmailMessage, EmailProvider } from "@/lib/email/types";

/**
 * Provedor padrão de desenvolvimento e testes (ADR-0005): não envia
 * e-mail de verdade, apenas registra a mensagem via logger estruturado.
 * Permite que o fluxo de recuperação de senha seja testável de ponta a
 * ponta sem depender de um provedor de e-mail real.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.info("E-mail registrado (provedor de console — nenhum envio real)", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    await Promise.resolve();
  }
}
