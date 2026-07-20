import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

test.describe("Acessibilidade — perfil do corretor", () => {
  test("página de edição de perfil não possui violações WCAG A/AA", async ({ page, request }) => {
    const email = uniqueEmail("a11y-profile");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });

  test("catálogo público não possui violações WCAG A/AA", async ({ page, request }) => {
    const email = uniqueEmail("a11y-catalog");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `a11y-catalog-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Maria Silva Imóveis");
    await page.getByLabel("Nome completo").fill("Maria da Silva");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByLabel("Número do CRECI").fill("12345");
    await page.getByLabel("Estado do CRECI (UF)").fill("SP");
    await page.getByLabel("WhatsApp").fill("11999999999");
    await page.getByLabel("Cidade de atuação").fill("São Paulo");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Catálogo publicado.")).toBeVisible();

    await page.goto(`/catalogo/${slug}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
