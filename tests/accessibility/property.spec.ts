import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

async function saveMinimalProfile(page: Page, slug: string): Promise<void> {
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome profissional").fill("Corretor Teste");
  await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
  await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
}

const TABS = [
  "Informações básicas",
  "Características",
  "Localização",
  "Fotos",
  "Descrição",
  "Revisão e publicação",
] as const;

test.describe("Acessibilidade — cadastro de imóveis", () => {
  test("lista de imóveis (vazia) não possui violações WCAG A/AA", async ({ page, request }) => {
    const email = uniqueEmail("a11y-property-list");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `a11y-property-list-${Date.now()}`);
    await page.goto("/painel/imoveis");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });

  test("todas as etapas do editor de imóvel não possuem violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("a11y-property-editor");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `a11y-property-editor-${Date.now()}`);

    await page.goto("/painel/imoveis");
    await page.getByRole("button", { name: "Novo imóvel" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

    const tabNav = page.getByRole("tablist", { name: "Etapas do cadastro" });

    for (const tab of TABS) {
      await tabNav.getByRole("tab", { name: tab, exact: true }).click();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, `etapa "${tab}" não deve ter violações`).toEqual([]);
    }

    await deleteTestUserByEmail(email);
  });
});
