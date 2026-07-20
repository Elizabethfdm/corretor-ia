import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { visibleAlert } from "../e2e/helpers/locators";

const pages = [
  { name: "Login", path: "/login" },
  { name: "Cadastro", path: "/cadastro" },
  { name: "Recuperar senha", path: "/recuperar-senha" },
];

test.describe("Acessibilidade — telas de autenticação", () => {
  for (const { name, path } of pages) {
    test(`${name} não possui violações WCAG A/AA detectáveis automaticamente`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("formulário de login com erro continua sem violações WCAG A/AA", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("email-invalido");
    await page.getByLabel("Senha").fill("qualquer");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(visibleAlert(page)).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    expect(results.violations).toEqual([]);
  });
});
