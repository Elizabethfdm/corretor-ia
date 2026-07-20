import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";

test.describe("Recuperação de senha (RN-014)", () => {
  test("mostra a mesma mensagem genérica para e-mail cadastrado e não cadastrado", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-recover");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await page.goto("/recuperar-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar link de redefinição" }).click();

    const messageForExisting = await page.getByRole("status").textContent();

    await page.goto("/recuperar-senha");
    await page.getByLabel("E-mail").fill("nunca-existiu-e2e@example.com");
    await page.getByRole("button", { name: "Enviar link de redefinição" }).click();

    const messageForNonExisting = await page.getByRole("status").textContent();

    expect(messageForExisting).toBe(messageForNonExisting);

    await deleteTestUserByEmail(email);
  });

  test("link de redefinição sem token exibe mensagem de link inválido", async ({ page }) => {
    await page.goto("/redefinir-senha");

    await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
  });
});
