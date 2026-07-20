import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "test-avatar.png");

async function saveMinimalProfile(page: Page, slug: string): Promise<void> {
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome profissional").fill("Corretor Teste");
  await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
  await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
}

async function createPropertyAndOpenEditor(page: Page): Promise<string> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);
  const url = page.url();
  return url.split("/painel/imoveis/")[1] ?? "";
}

test.describe("Cadastro de imóveis (RN-026 a RN-045)", () => {
  test("corretor cadastra um imóvel completo, envia fotos e publica no catálogo", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-property-full");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-property-full-${Date.now()}`);

    await createPropertyAndOpenEditor(page);

    // Etapa 1: informações básicas
    await page.getByLabel("Título interno").fill("Casa com piscina no Jardim Europa");
    await page.getByLabel("Finalidade").selectOption("SALE");
    await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
    await page.getByLabel("Valor (R$)").fill("450000.50");
    await page.getByRole("button", { name: "Salvar informações básicas" }).click();
    await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

    // Etapa 2: características
    await page.getByRole("button", { name: "Características" }).click();
    await page.getByLabel("Quartos").fill("3");
    await page.getByLabel("Banheiros").fill("2");
    await page.getByLabel("Vagas").fill("2");
    await page.getByLabel("Piscina").check();
    await page.getByRole("button", { name: "Salvar características" }).click();
    await expect(page.getByText("Características salvas.")).toBeVisible();

    // Etapa 3: localização
    await page.getByRole("button", { name: "Localização" }).click();
    await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
    await page.getByLabel("Bairro").fill("Jardim Europa");
    await page.getByRole("button", { name: "Salvar localização" }).click();
    await expect(page.getByText("Localização salva.")).toBeVisible();

    // Etapa 4: fotos
    await page.getByRole("button", { name: "Fotos" }).click();
    await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
    await page.getByRole("button", { name: "Enviar fotos" }).click();
    await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();
    await expect(page.getByText("Capa")).toBeVisible();

    // Etapa 5: descrição
    await page.getByRole("button", { name: "Descrição" }).click();
    await page.getByLabel("Descrição completa").fill("Uma bela casa com piscina e área gourmet.");
    await page.getByRole("button", { name: "Salvar descrição" }).click();
    await expect(page.getByText("Descrição salva.")).toBeVisible();

    // Etapa 6: revisão e publicação
    await page.getByRole("button", { name: "Revisão e publicação" }).click();
    await expect(page.getByText("Pendente para publicação:")).not.toBeVisible();
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Imóvel publicado.")).toBeVisible();
    await expect(page.getByText("Disponível", { exact: true })).toBeVisible();

    await page.goto("/painel/imoveis");
    await expect(page.getByText("Casa com piscina no Jardim Europa")).toBeVisible();
    await expect(page.getByText("Disponível")).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("bloqueia a publicação e lista os requisitos ausentes (RN-043)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-property-block");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-property-block-${Date.now()}`);

    await createPropertyAndOpenEditor(page);

    await page.getByRole("button", { name: "Revisão e publicação" }).click();

    await expect(page.getByText("Pendente para publicação:")).toBeVisible();
    await expect(
      page.getByText('Informe o valor ou marque a opção "Consulte o valor".'),
    ).toBeVisible();
    await expect(page.getByText("Adicione ao menos uma foto do imóvel.")).toBeVisible();

    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("permite reservar, marcar como vendido e despublicar um imóvel publicado (RN-027, RN-032)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-property-status");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-property-status-${Date.now()}`);
    await createPropertyAndOpenEditor(page);

    await page.getByLabel("Título interno").fill("Apartamento para status");
    await page.getByLabel("Finalidade").selectOption("RENT");
    await page.getByLabel("Tipo do imóvel").selectOption("APARTMENT");
    await page.getByLabel("Valor (R$)").fill("2500");
    await page.getByRole("button", { name: "Salvar informações básicas" }).click();
    await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

    await page.getByRole("button", { name: "Localização" }).click();
    await page.getByLabel("Cidade", { exact: true }).fill("Belo Horizonte");
    await page.getByLabel("Bairro").fill("Savassi");
    await page.getByRole("button", { name: "Salvar localização" }).click();
    await expect(page.getByText("Localização salva.")).toBeVisible();

    await page.getByRole("button", { name: "Fotos" }).click();
    await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
    await page.getByRole("button", { name: "Enviar fotos" }).click();
    await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();

    await page.getByRole("button", { name: "Descrição" }).click();
    await page.getByLabel("Descrição completa").fill("Apartamento mobiliado e completo.");
    await page.getByRole("button", { name: "Salvar descrição" }).click();
    await expect(page.getByText("Descrição salva.")).toBeVisible();

    await page.getByRole("button", { name: "Revisão e publicação" }).click();
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Imóvel publicado.")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como reservado" }).click();
    await expect(page.getByText('Status alterado para "Reservado".')).toBeVisible();

    await page.getByRole("button", { name: "Marcar como vendido" }).click();
    await expect(page.getByText('Status alterado para "Vendido".')).toBeVisible();

    await page.getByRole("button", { name: "Despublicar" }).click();
    await expect(page.getByText("Imóvel despublicado.")).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("permite excluir e restaurar um imóvel (RN-028)", async ({ page, request }) => {
    const email = uniqueEmail("e2e-property-delete");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-property-delete-${Date.now()}`);
    await createPropertyAndOpenEditor(page);

    await page.getByLabel("Título interno").fill("Imóvel para exclusão");
    await page.getByRole("button", { name: "Salvar informações básicas" }).click();
    await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

    await page.getByRole("button", { name: "Revisão e publicação" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir imóvel" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis$/);

    await expect(page.getByRole("link", { name: /Imóvel para exclusão/ })).not.toBeVisible();
    await expect(page.getByText("Excluídos recentemente")).toBeVisible();

    await page.getByRole("button", { name: "Restaurar" }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

    await page.goto("/painel/imoveis");
    await expect(page.getByRole("link", { name: /Imóvel para exclusão/ })).toBeVisible();
    await expect(page.getByText("Excluídos recentemente")).not.toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("isolamento entre corretores: não é possível abrir imóvel de outro corretor (RN-026)", async ({
    page,
    request,
  }) => {
    const emailA = uniqueEmail("e2e-property-iso-a");
    const emailB = uniqueEmail("e2e-property-iso-b");
    await createTestUser(request, { name: "Corretor A", email: emailA, password: "senha1234" });
    await createTestUser(request, { name: "Corretor B", email: emailB, password: "senha1234" });

    await loginAs(page, emailA, "senha1234");
    await saveMinimalProfile(page, `e2e-property-iso-a-${Date.now()}`);
    const propertyId = await createPropertyAndOpenEditor(page);

    await page.goto("/painel");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await loginAs(page, emailB, "senha1234");
    await saveMinimalProfile(page, `e2e-property-iso-b-${Date.now()}`);

    const response = await page.goto(`/painel/imoveis/${propertyId}`);
    expect(response?.status()).toBe(404);

    await deleteTestUserByEmail(emailA);
    await deleteTestUserByEmail(emailB);
  });
});
