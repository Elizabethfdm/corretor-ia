/**
 * Monta um link wa.me a partir de um número de telefone brasileiro em
 * qualquer formato e uma mensagem (RN-051: URL corretamente codificada,
 * preservando acentos).
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
