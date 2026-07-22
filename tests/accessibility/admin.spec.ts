import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  createTestUser,
  deleteTestUserByEmail,
  promoteToAdmin,
  uniqueEmail,
} from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

test.describe("Acessibilidade — painel administrativo", () => {
  test("painel administrativo (sem corretores e com corretores) não possui violações WCAG A/AA", async ({
    page,
    browser,
    request,
  }) => {
    test.setTimeout(60_000);

    const adminEmail = uniqueEmail("a11y-admin");
    await createTestUser(request, { name: "Admin Teste", email: adminEmail, password: "senha1234" });
    await promoteToAdmin(adminEmail);

    await loginAs(page, adminEmail, "senha1234");
    await page.goto("/painel-admin");
    await expect(page.getByText("Corretores cadastrados")).toBeVisible();

    const emptyResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(emptyResults.violations).toEqual([]);

    const brokerEmail = uniqueEmail("a11y-admin-broker");
    await createTestUser(request, {
      name: "Corretor Teste",
      email: brokerEmail,
      password: "senha1234",
    });
    const brokerContext = await browser.newContext();
    const brokerPage = await brokerContext.newPage();
    await loginAs(brokerPage, brokerEmail, "senha1234");
    await brokerPage.goto("/painel/perfil");
    await brokerPage.getByLabel("Nome profissional").fill("Corretor Teste");
    await brokerPage.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await brokerPage.getByLabel("Endereço do catálogo (slug)").fill(`a11y-admin-broker-${Date.now()}`);
    await brokerPage.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(brokerPage.getByText("Perfil salvo com sucesso.")).toBeVisible();
    await brokerContext.close();

    await page.reload();
    const brokerSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Corretores", exact: true }) });
    await expect(brokerSection.getByText(brokerEmail)).toBeVisible();

    const filledResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(filledResults.violations).toEqual([]);

    await deleteTestUserByEmail(adminEmail);
    await deleteTestUserByEmail(brokerEmail);
  });
});
