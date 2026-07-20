export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Nível mínimo configurável via LOG_LEVEL (RNF-041). Em produção, o padrão
 * é "info" para evitar ruído; em desenvolvimento, "debug".
 */
function getMinLevel(): LogLevel {
  const configured = process.env["LOG_LEVEL"] as LogLevel | undefined;
  if (configured && configured in LEVEL_ORDER) {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const SENSITIVE_KEY_PATTERN = /password|senha|token|secret|apikey|api_key|authorization/i;

/**
 * Remove valores de chaves sensíveis antes de logar, para cumprir RNF-036
 * (logs nunca contêm senha, token, chave de API ou dado pessoal sensível).
 */
function sanitize(context: LogContext): LogContext {
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : value;
  }
  return sanitized;
}

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[getMinLevel()]) {
    return;
  }

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitize(context),
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
