import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

test.describe("Acessibilidade — anúncios com IA (fluxo manual via prompt)", () => {
  test("aba de anúncios (vazia, com prompt montado, e com anúncio salvo) não possui violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("a11y-ad-generation");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(`a11y-ad-generation-${Date.now()}`);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel/imoveis");
    await page.getByRole("button", { name: "Novo imóvel" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);
    await page.getByLabel("Título interno").fill("Casa para teste de acessibilidade");
    await page.getByLabel("Finalidade").selectOption("SALE");
    await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
    await page.getByRole("button", { name: "Salvar informações básicas" }).click();
    await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

    const tabNav = page.getByRole("tablist", { name: "Etapas do cadastro" });
    await tabNav.getByRole("tab", { name: "Anúncios com IA", exact: true }).click();

    const emptyResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(emptyResults.violations).toEqual([]);

    await page.getByLabel("Canal").selectOption("INSTAGRAM");
    await page.getByLabel("Tom").selectOption("PROFESSIONAL");
    await page.getByLabel("Objetivo do anúncio").fill("Atrair famílias jovens");
    await page.getByRole("button", { name: "Montar prompt com IA" }).click();
    await expect(page.getByText("Prompt pronto")).toBeVisible();

    const promptResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(promptResults.violations).toEqual([]);

    await page.getByLabel("Título").fill("Casa para teste de acessibilidade — anúncio");
    await page.getByLabel("Texto").fill("Texto colado da ferramenta de IA.");
    await page.getByLabel("Chamada para ação").fill("Fale conosco!");
    await page.getByRole("button", { name: "Salvar anúncio" }).click();
    await expect(page.getByText("Anúncio salvo.")).toBeVisible();

    const savedResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(savedResults.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
