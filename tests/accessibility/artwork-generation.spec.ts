import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "test-avatar.png");

test.describe("Acessibilidade — geração de artes para redes sociais", () => {
  test("aba de artes (sem foto, com formulário, e com uma arte gerada) não possui violações WCAG A/AA", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("a11y-artwork-generation");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page
      .getByLabel("Endereço do catálogo (slug)")
      .fill(`a11y-artwork-generation-${Date.now()}`);
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
    await tabNav.getByRole("tab", { name: "Artes", exact: true }).click();
    await expect(
      page.getByText('Adicione ao menos uma foto ao imóvel (aba "Fotos") antes de gerar uma arte.'),
    ).toBeVisible();

    const noPhotoResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(noPhotoResults.violations).toEqual([]);

    await tabNav.getByRole("tab", { name: "Fotos", exact: true }).click();
    await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
    await page.getByRole("button", { name: "Enviar fotos" }).click();
    await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();

    await tabNav.getByRole("tab", { name: "Artes", exact: true }).click();
    const formResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(formResults.violations).toEqual([]);

    await page.getByLabel("Tipo de anúncio").selectOption("NEW_PROPERTY");
    await page.getByRole("button", { name: "Gerar arte" }).click();
    await expect(page.getByText("Arte gerada.")).toBeVisible();

    const filledResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(filledResults.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
