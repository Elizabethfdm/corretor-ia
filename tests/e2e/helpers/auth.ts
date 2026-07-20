import { expect, type Page } from "@playwright/test";

/**
 * Faz login pela UI e aguarda o redirecionamento para /painel antes de
 * retornar — evita condição de corrida entre o fetch assíncrono da
 * Server Action de login (que define o cookie de sessão) e uma
 * navegação subsequente disparada cedo demais pelo teste.
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
