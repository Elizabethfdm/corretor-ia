import { expect, test } from "@playwright/test";
import {
  createTestUser,
  deleteTestUserByEmail,
  promoteToAdmin,
  uniqueEmail,
} from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

const APP_URL = process.env["APP_URL"] ?? "http://localhost:3000";

test.describe("Painel administrativo (RN-091 a RN-095)", () => {
  test("corretor comum é redirecionado ao tentar acessar o painel administrativo", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-admin-denied");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel-admin");
    await expect(page).toHaveURL(/\/acesso-negado$/);

    await deleteTestUserByEmail(email);
  });

  test("administrador lista corretores, bloqueia e desbloqueia uma conta", async ({
    page,
    browser,
    request,
  }) => {
    test.setTimeout(90_000);

    const adminEmail = uniqueEmail("e2e-admin");
    await createTestUser(request, {
      name: "Admin Teste",
      email: adminEmail,
      password: "senha1234",
    });
    await promoteToAdmin(adminEmail);

    const brokerEmail = uniqueEmail("e2e-admin-broker");
    await createTestUser(request, {
      name: "Corretor Alvo",
      email: brokerEmail,
      password: "senha1234",
    });

    // O corretor precisa ter um BrokerProfile salvo para aparecer na
    // listagem do admin (RF-072) — uma conta recém-criada sem perfil
    // ainda não é "um corretor" no modelo de dados (Fase 3). Usa um
    // contexto de navegador isolado (cookies próprios) para não
    // misturar a sessão do corretor com a do administrador, que usa a
    // `page`/`context` padrão do teste.
    const brokerContext = await browser.newContext();
    const brokerPage = await brokerContext.newPage();
    await loginAs(brokerPage, brokerEmail, "senha1234");
    await brokerPage.goto("/painel/perfil");
    await brokerPage.getByLabel("Nome profissional").fill("Corretor Alvo");
    await brokerPage.getByLabel("Nome completo").fill("Corretor Alvo Completo");
    await brokerPage
      .getByLabel("Endereço do catálogo (slug)")
      .fill(`e2e-admin-broker-${Date.now()}`);
    await brokerPage.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(brokerPage.getByText("Perfil salvo com sucesso.")).toBeVisible();
    await brokerContext.close();

    await loginAs(page, adminEmail, "senha1234");
    await page.goto("/painel-admin");

    await expect(page.getByText("Corretores cadastrados")).toBeVisible();
    const brokerSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Corretores", exact: true }) });
    const brokerRow = brokerSection.getByRole("listitem").filter({ hasText: brokerEmail });
    await expect(brokerRow).toBeVisible();

    await brokerRow.getByRole("button", { name: "Bloquear" }).click();
    await expect(page.getByText("Bloqueado")).toBeVisible();

    const blockedLogin = await request.post("/api/auth/sign-in/email", {
      headers: { origin: APP_URL },
      data: { email: brokerEmail, password: "senha1234" },
    });
    expect(blockedLogin.ok()).toBe(false);

    await brokerRow.getByRole("button", { name: "Desbloquear" }).click();
    await expect(page.getByText("Bloqueado")).not.toBeVisible();

    const unblockedLogin = await request.post("/api/auth/sign-in/email", {
      headers: { origin: APP_URL },
      data: { email: brokerEmail, password: "senha1234" },
    });
    expect(unblockedLogin.ok()).toBe(true);

    await deleteTestUserByEmail(adminEmail);
    await deleteTestUserByEmail(brokerEmail);
  });
});
