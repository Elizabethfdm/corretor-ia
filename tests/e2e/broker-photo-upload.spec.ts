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

test.describe("Upload de foto e logotipo (RN-021, RN-024, RN-035)", () => {
  test("corretor envia foto de perfil e ela aparece na página após o upload", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-photo-upload");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-photo-upload-${Date.now()}`);

    await expect(page.getByText("Sem imagem").first()).toBeVisible();

    const photoForm = page.locator("form", { hasText: "Foto de perfil" });
    await photoForm.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
    await photoForm.getByRole("button", { name: "Enviar imagem" }).click();

    await expect(photoForm.getByText("Imagem atualizada com sucesso.")).toBeVisible();
    await expect(photoForm.locator("img")).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("rejeita arquivo inválido com mensagem amigável", async ({ page, request }) => {
    const email = uniqueEmail("e2e-photo-invalid");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-photo-invalid-${Date.now()}`);

    const logoForm = page.locator("form", { hasText: "Logotipo" });
    await logoForm.locator('input[type="file"]').setInputFiles({
      name: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("isto nao e uma imagem de verdade"),
    });
    await logoForm.getByRole("button", { name: "Enviar imagem" }).click();

    await expect(logoForm.getByText("Formato de imagem não suportado.")).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("upload é bloqueado com mensagem clara quando o perfil ainda não foi salvo", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-photo-no-profile");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");

    await expect(
      page.getByText("Salve as informações acima para poder enviar foto de perfil e logotipo."),
    ).toBeVisible();

    await deleteTestUserByEmail(email);
  });
});
