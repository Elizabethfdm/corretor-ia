import { randomUUID } from "node:crypto";

/**
 * Gera uma chave de armazenamento aleatória e segura (RN-036) — nunca
 * derivada do nome original do arquivo enviado pelo usuário.
 */
export function generateStorageKey(prefix: string, extension: string): string {
  return `${prefix}/${randomUUID()}.${extension}`;
}
