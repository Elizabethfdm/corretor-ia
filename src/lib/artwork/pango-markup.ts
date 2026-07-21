/**
 * O texto renderizado via `sharp({ text: ... })` é interpretado como
 * Pango markup (formato tipo-XML) — texto vindo do corretor precisa
 * ser escapado antes de entrar em uma tag `<span>`, senão caracteres
 * como `<`/`&` quebram o markup e a geração da imagem falha.
 */
export function escapePangoMarkup(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
