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

test.describe("Anúncios com IA — fluxo manual via prompt (RN-061 a RN-068)", () => {
  test("corretor monta o prompt, copia para o ChatGPT, cola o resultado e edita", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-ad-generate");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-ad-generate-${Date.now()}`);
    await createMinimalProperty(page);

    await page
      .getByRole("tablist", { name: "Etapas do cadastro" })
      .getByRole("tab", { name: "Anúncios com IA", exact: true })
      .click();

    await expect(page.getByText("Nenhum anúncio gerado ainda para este imóvel.")).toBeVisible();

    await page.getByLabel("Canal").selectOption("INSTAGRAM");
    await page.getByLabel("Tom").selectOption("PROFESSIONAL");
    await page.getByLabel("Tamanho do texto").selectOption("MEDIUM");
    await page.getByLabel("Objetivo do anúncio").fill("Atrair famílias jovens");
    await page.getByRole("button", { name: "Montar prompt com IA" }).click();

    await expect(page.getByText("Prompt pronto")).toBeVisible();
    const promptField = page.getByLabel("Prompt para colar na ferramenta de IA");
    await expect(promptField).toHaveValue(/Atrair famílias jovens/);

    const chatGptLink = page.getByRole("link", { name: "Abrir ChatGPT" });
    await expect(chatGptLink).toHaveAttribute("href", "https://chatgpt.com/");
    await expect(chatGptLink).toHaveAttribute("target", "_blank");

    // RF-055: o corretor cola de volta o que obteve na ferramenta de IA externa.
    await page.getByLabel("Título").fill("Casa com piscina — Jardim Europa");
    await page.getByLabel("Texto").fill("Casa espaçosa com piscina, ideal para famílias.");
    await page.getByLabel("Chamada para ação").fill("Agende sua visita!");
    await page.getByLabel("Hashtags (separadas por vírgula, opcional)").fill("imoveis, casa");
    await page.getByRole("button", { name: "Salvar anúncio" }).click();

    await expect(page.getByText("Anúncio salvo.")).toBeVisible();
    await expect(page.getByText("Assistido por IA")).toBeVisible();
    await expect(page.getByText("Nenhum anúncio gerado ainda para este imóvel.")).not.toBeVisible();

    // RF-057: editar o conteúdo salvo antes de copiar/compartilhar.
    await page.getByLabel("Título").fill("Título editado pelo corretor");
    await page.getByRole("button", { name: "Salvar edição" }).click();
    await expect(page.getByText("Anúncio atualizado.")).toBeVisible();
    await expect(page.getByText("Editado pelo corretor")).toBeVisible();
    await expect(page.getByLabel("Título")).toHaveValue("Título editado pelo corretor");

    await deleteTestUserByEmail(email);
  });
});
