import type { Locator, Page } from "@playwright/test";

/**
 * O Next.js renderiza um `<div role="alert" id="__next-route-announcer__">`
 * global (vazio) para anunciar mudanças de rota a leitores de tela. Isso
 * faz `page.getByRole("alert")` sozinho violar o modo estrito do
 * Playwright sempre que também há um alerta nosso na página. Este helper
 * filtra apenas alertas com conteúdo real.
 */
export function visibleAlert(page: Page): Locator {
  return page.getByRole("alert").filter({ hasText: /\S/ });
}
