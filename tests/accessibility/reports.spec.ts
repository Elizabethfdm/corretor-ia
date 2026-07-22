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
    await expect(
      page.getByText("Nenhum dado registrado para o período selecionado."),
    ).toBeVisible();

    const emptyResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(emptyResults.violations).toEqual([]);

    await page.getByLabel("Período").selectOption("30d");
    // RF-068: aplicar o filtro é uma navegação completa (formulário GET).
    // Esperar só o texto ficar visível (ou só `waitForLoadState("load")`)
    // não foi suficiente no WebKit — o `page.evaluate` do axe-core ainda
    // corria risco de pegar a página no meio de um assentamento tardio
    // ("Execution context was destroyed, most likely because of a
    // navigation"), de forma intermitente. `waitForURL` aguarda o sinal
    // mais inequívoco de que a navegação em si já terminou (a nova URL
    // com o filtro aplicado), amarrado ao clique via `Promise.all` para
    // não perder o evento de navegação por uma corrida entre os dois.
    await Promise.all([
      page.waitForURL(/period=30d/),
      page.getByRole("button", { name: "Aplicar" }).click(),
    ]);
    await page.waitForLoadState("load");
    await expect(
      page.getByText("Nenhum dado registrado para o período selecionado."),
    ).toBeVisible();

    const filledResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(filledResults.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
