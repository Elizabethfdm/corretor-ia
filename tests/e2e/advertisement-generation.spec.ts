import { expect, test, type Page } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

async function saveMinimalProfile(page: Page, slug: string): Promise<void> {
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome profissional").fill("Corretor Teste");
  await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
  await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
}

async function createMinimalProperty(page: Page): Promise<string> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);
  const propertyId = page.url().split("/painel/imoveis/")[1]!;

  await page.getByLabel("Título interno").fill("Casa com piscina no Jardim Europa");
  await page.getByLabel("Finalidade").selectOption("SALE");
  await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
  await page.getByLabel("Valor (R$)").fill("450000");
  await page.getByRole("button", { name: "Salvar informações básicas" }).click();
  await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

  return propertyId;
}

test.describe("Geração de anúncios com IA (RN-061 a RN-074)", () => {
  test("corretor gera um anúncio, vê o selo de IA, e edita o resultado", async ({ page, request }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-ad-generate");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-ad-generate-${Date.now()}`);
    await createMinimalProperty(page);

    await page
      .getByRole("navigation", { name: "Etapas do cadastro" })
      .getByRole("button", { name: "Anúncios com IA", exact: true })
      .click();

    await expect(page.getByText("Nenhum anúncio gerado ainda para este imóvel.")).toBeVisible();

    await page.getByLabel("Canal").selectOption("INSTAGRAM");
    await page.getByLabel("Tom").selectOption("PROFESSIONAL");
    await page.getByLabel("Tamanho do texto").selectOption("MEDIUM");
    await page.getByLabel("Objetivo do anúncio").fill("Atrair famílias jovens");
    await page.getByRole("button", { name: "Gerar anúncio com IA" }).click();

    await expect(page.getByText("Anúncio gerado.")).toBeVisible();
    await expect(page.getByText("Gerado por IA")).toBeVisible();
    await expect(page.getByText("Nenhum anúncio gerado ainda para este imóvel.")).not.toBeVisible();

    // RF-057: editar o conteúdo gerado antes de copiar/compartilhar.
    await page.getByLabel("Título").fill("Título editado pelo corretor");
    await page.getByRole("button", { name: "Salvar edição" }).click();
    await expect(page.getByText("Anúncio atualizado.")).toBeVisible();
    await expect(page.getByText("Editado pelo corretor")).toBeVisible();
    await expect(page.getByLabel("Título")).toHaveValue("Título editado pelo corretor");

    await deleteTestUserByEmail(email);
  });
});
