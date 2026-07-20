import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";

test.describe("Proteção de rotas (RF-007 a RF-009, RN-009, RN-010)", () => {
  test("visitante não autenticado é redirecionado ao login ao acessar o painel", async ({
    page,
  }) => {
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("corretor autenticado é redirecionado ao painel ao visitar login ou cadastro", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-protect");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("senha1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/painel$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/painel$/);

    await page.goto("/cadastro");
    await expect(page).toHaveURL(/\/painel$/);

    await deleteTestUserByEmail(email);
  });
});
