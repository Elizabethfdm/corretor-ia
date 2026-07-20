import { expect, test } from "@playwright/test";
import { deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { visibleAlert } from "./helpers/locators";

test.describe("Cadastro de conta", () => {
  test("corretor consegue criar conta e é redirecionado ao painel", async ({ page }) => {
    const email = uniqueEmail("e2e-register");

    await page.goto("/cadastro");

    await page.getByLabel("Nome completo").fill("Maria Silva");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha1234");
    await page.getByLabel("Confirmar senha").fill("senha1234");
    await page.getByRole("checkbox", { name: /Termos de Uso/ }).check();
    await page.getByRole("checkbox", { name: /Política de Privacidade/ }).check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByRole("heading", { name: /Olá, Maria Silva/ })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("mostra erros de validação sem enviar o formulário com senhas divergentes", async ({
    page,
  }) => {
    const email = uniqueEmail("e2e-register-mismatch");

    await page.goto("/cadastro");

    await page.getByLabel("Nome completo").fill("Maria Silva");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha1234");
    await page.getByLabel("Confirmar senha").fill("outraSenha1");
    await page.getByRole("checkbox", { name: /Termos de Uso/ }).check();
    await page.getByRole("checkbox", { name: /Política de Privacidade/ }).check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(visibleAlert(page)).toContainText("não coincide");
    await expect(page).toHaveURL(/\/cadastro$/);
  });

  test("impede cadastro sem aceitar os Termos de Uso (RN-011)", async ({ page }) => {
    const email = uniqueEmail("e2e-register-no-terms");

    await page.goto("/cadastro");

    await page.getByLabel("Nome completo").fill("Maria Silva");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha1234");
    await page.getByLabel("Confirmar senha").fill("senha1234");
    await page.getByRole("checkbox", { name: /Política de Privacidade/ }).check();

    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/cadastro$/);
    await expect(page.getByText(/aceitar os Termos de Uso/)).toBeVisible();
  });
});
