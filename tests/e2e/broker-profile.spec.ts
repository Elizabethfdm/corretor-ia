import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

test.describe("Perfil do corretor", () => {
  test("painel mostra CTA para completar o perfil quando ainda não existe", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-profile-cta");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");

    await expect(page.getByText("Complete seu perfil profissional")).toBeVisible();
    await page.getByRole("link", { name: "Completar perfil" }).click();
    await expect(page).toHaveURL(/\/painel\/perfil$/);

    await deleteTestUserByEmail(email);
  });

  test("corretor consegue salvar o perfil com sucesso", async ({ page, request }) => {
    const email = uniqueEmail("e2e-profile-save");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-profile-save-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");

    await page.getByLabel("Nome profissional").fill("Maria Silva Imóveis");
    await page.getByLabel("Nome completo").fill("Maria da Silva");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByLabel("Endereço do catálogo (slug)").blur();
    await expect(page.getByText(`"${slug}" está disponível.`)).toBeVisible();

    await page.getByRole("button", { name: "Salvar perfil" }).click();

    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel");
    await expect(page.getByText("Maria Silva Imóveis")).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("impede usar um slug já utilizado por outro corretor (RN-019)", async ({
    page,
    request,
  }) => {
    const emailA = uniqueEmail("e2e-slug-owner");
    const emailB = uniqueEmail("e2e-slug-taker");
    await createTestUser(request, { name: "Corretor A", email: emailA, password: "senha1234" });
    await createTestUser(request, { name: "Corretor B", email: emailB, password: "senha1234" });
    const slug = `e2e-slug-disputado-${Date.now()}`;

    await loginAs(page, emailA, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor A");
    await page.getByLabel("Nome completo").fill("Corretor A Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await loginAs(page, emailB, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor B");
    await page.getByLabel("Nome completo").fill("Corretor B Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
    await page.getByRole("button", { name: "Salvar perfil" }).click();

    await expect(page.getByText("Este slug já está em uso por outro corretor.")).toBeVisible();

    await deleteTestUserByEmail(emailA);
    await deleteTestUserByEmail(emailB);
  });
});
