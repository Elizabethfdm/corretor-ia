import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { visibleAlert } from "./helpers/locators";

test.describe("Login e logout", () => {
  test("corretor autentica, acessa o painel e depois consegue sair", async ({ page, request }) => {
    const email = uniqueEmail("e2e-login");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("senha1234");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);

    // Depois do logout, a rota privada deve voltar a exigir login (RF-007).
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/login$/);

    await deleteTestUserByEmail(email);
  });

  test("mostra mensagem genérica para credenciais inválidas, sem revelar o motivo (RN-007)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-login-wrong");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("senhaErrada1");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(visibleAlert(page)).toHaveText("E-mail ou senha inválidos.");
    await expect(page).toHaveURL(/\/login$/);

    await deleteTestUserByEmail(email);
  });
});
