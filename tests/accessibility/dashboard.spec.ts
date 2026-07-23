import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

test.describe("Acessibilidade — dashboard do painel", () => {
  test("painel sem perfil (CTA para completar) não possui violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("a11y-dashboard-cta");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });

  test("painel com perfil e imóveis cadastrados não possui violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("a11y-dashboard-full");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(`a11y-dashboard-${Date.now()}`);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel/imoveis");
    await page.getByRole("button", { name: "Novo imóvel" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

    await page.goto("/painel");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
