import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

test.describe("Publicação do catálogo (RN-016 a RN-018, RN-022)", () => {
  test("catálogo só fica público após preencher CRECI, WhatsApp e cidade, e some ao despublicar", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-catalog-publish");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-catalog-publish-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Maria Silva Imóveis");
    await page.getByLabel("Nome completo").fill("Maria da Silva");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    // Sem CRECI/WhatsApp/cidade, a publicação deve ser bloqueada.
    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText(/Informe o número do CRECI\./)).toBeVisible();

    const visitorCheckBeforePublish = await page.request.get(`/catalogo/${slug}`);
    expect(visitorCheckBeforePublish.status()).toBe(404);

    await page.getByLabel("Número do CRECI").fill("12345");
    await page.getByLabel("Estado do CRECI (UF)").fill("SP");
    await page.getByLabel("WhatsApp").fill("11999999999");
    await page.getByLabel("Cidade de atuação").fill("São Paulo");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.getByRole("button", { name: "Publicar catálogo" }).click();
    await expect(page.getByText("Catálogo publicado.")).toBeVisible();

    await page.goto(`/catalogo/${slug}`);
    await expect(page.getByRole("heading", { name: "Maria Silva Imóveis" })).toBeVisible();
    await expect(page.getByText("CRECI 12345/SP")).toBeVisible();
    await expect(page.getByRole("link", { name: "Falar no WhatsApp" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/5511999999999/,
    );

    await page.goto("/painel/perfil");
    await page.getByRole("button", { name: "Despublicar catálogo" }).click();
    await expect(page.getByText("Catálogo despublicado.")).toBeVisible();

    const visitorCheckAfterUnpublish = await page.request.get(`/catalogo/${slug}`);
    expect(visitorCheckAfterUnpublish.status()).toBe(404);

    await deleteTestUserByEmail(email);
  });

  test("catálogo de slug inexistente retorna 404 para visitante", async ({ page }) => {
    const response = await page.request.get("/catalogo/slug-que-nunca-existiu-em-lugar-nenhum");
    expect(response.status()).toBe(404);
  });
});
