const COMBINING_DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Converte um texto livre em um slug amigável: minúsculas, sem
 * acentuação, apenas letras/números separados por hífen simples.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
