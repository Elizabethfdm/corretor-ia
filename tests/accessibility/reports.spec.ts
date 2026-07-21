import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

test.describe("Acessibilidade — relatórios", () => {
  test("página de relatórios (vazia e com dados) não possui violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("a11y-reports");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(`a11y-reports-${Date.now()}`);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel/relatorios");
    await expect(page.getByText("Nenhum dado registrado para o período selecionado.")).toBeVisible();

    const emptyResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(emptyResults.violations).toEqual([]);

    await page.getByLabel("Período").selectOption("30d");
    await page.getByRole("button", { name: "Aplicar" }).click();

    const filledResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(filledResults.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
