import { isAPIError } from "better-auth/api";
import { logger } from "@/lib/observability/logger";

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";
const GENERIC_UNEXPECTED_ERROR = "Não foi possível concluir a solicitação. Tente novamente.";

/**
 * RN-007: mensagens de erro de autenticação nunca revelam se a falha foi
 * por e-mail inexistente, senha incorreta ou conta bloqueada — todas
 * usam a mesma mensagem genérica. O erro real é sempre logado para
 * investigação interna.
 */
export function mapSignInError(error: unknown, context: Record<string, unknown> = {}): string {
  logSafely("Falha ao autenticar", error, context);

  if (isAPIError(error) && error.status === 429) {
    return "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.";
  }

  return GENERIC_LOGIN_ERROR;
}

export function mapSignUpError(error: unknown, context: Record<string, unknown> = {}): string {
  logSafely("Falha ao cadastrar conta", error, context);

  if (isAPIError(error)) {
    if (error.status === 429) {
      return "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.";
    }
    if (error.status === 422 || error.status === 400) {
      return "Não foi possível concluir o cadastro com os dados informados. Verifique o e-mail e tente novamente.";
    }
  }

  return GENERIC_UNEXPECTED_ERROR;
}

export function mapResetPasswordError(
  error: unknown,
  context: Record<string, unknown> = {},
): string {
  logSafely("Falha ao redefinir senha", error, context);

  if (isAPIError(error) && error.status === 429) {
    return "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.";
  }

  return "Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.";
}

function logSafely(message: string, error: unknown, context: Record<string, unknown>): void {
  logger.warn(message, {
    ...context,
    errorMessage: isAPIError(error) ? error.message : "erro desconhecido",
    status: isAPIError(error) ? error.status : undefined,
  });
}
