import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "../e2e/helpers/test-users";
import { loginAs } from "../e2e/helpers/auth";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "test-avatar.png");

test.describe("Acessibilidade — página individual do imóvel", () => {
  test("página do imóvel não possui violações WCAG A/AA", async ({ page, request }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("a11y-property-page");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `a11y-property-page-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByLabel("Número do CRECI").fill("12345");
    await page.getByLabel("Estado do CRECI (UF)").fill("SP");
    await page.getByLabel("WhatsApp").fill("11999999999");
    await page.getByLabel("Cidade de atuação").fill("São Paulo");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Catálogo publicado.")).toBeVisible();

    await page.goto("/painel/imoveis");
    await page.getByRole("button", { name: "Novo imóvel" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

    await page.getByLabel("Título interno").fill("Casa para teste de acessibilidade");
    await page.getByLabel("Título público (opcional)").fill("Casa para teste de acessibilidade");
    await page.getByLabel("Finalidade").selectOption("SALE");
    await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
    await page.getByLabel("Valor (R$)").fill("450000");
    await page.getByRole("button", { name: "Salvar informações básicas" }).click();
    await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

    await page.getByRole("tab", { name: "Localização" }).click();
    await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
    await page.getByLabel("Bairro").fill("Centro");
    await page.getByRole("button", { name: "Salvar localização" }).click();
    await expect(page.getByText("Localização salva.")).toBeVisible();

    await page.getByRole("tab", { name: "Fotos" }).click();
    await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
    await page.getByRole("button", { name: "Enviar fotos" }).click();
    await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();

    await page.getByRole("tab", { name: "Descrição" }).click();
    await page.getByLabel("Descrição completa").fill("Descrição para teste de acessibilidade.");
    await page.getByRole("button", { name: "Salvar descrição" }).click();
    await expect(page.getByText("Descrição salva.")).toBeVisible();

    await page.getByRole("tab", { name: "Revisão e publicação" }).click();
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Imóvel publicado.")).toBeVisible();

    await page.goto(`/catalogo/${slug}`);
    await page.getByRole("link", { name: /Casa para teste de acessibilidade/ }).click();
    await expect(page).toHaveURL(/\/catalogo\/[^/]+\/[^/]+$/);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);

    await deleteTestUserByEmail(email);
  });
});
