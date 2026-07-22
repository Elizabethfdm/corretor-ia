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

async function createPropertyWithPhoto(page: Page): Promise<void> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

  await page.getByLabel("Título interno").fill("Casa com piscina no Jardim Europa");
  await page.getByLabel("Finalidade").selectOption("SALE");
  await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
  await page.getByLabel("Valor (R$)").fill("450000");
  await page.getByRole("button", { name: "Salvar informações básicas" }).click();
  await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

  const nav = page.getByRole("tablist", { name: "Etapas do cadastro" });
  await nav.getByRole("tab", { name: "Fotos", exact: true }).click();
  await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
  await page.getByRole("button", { name: "Enviar fotos" }).click();
  await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();
}

test.describe("Geração de artes para redes sociais (RN-075 a RN-081)", () => {
  test("corretor gera uma arte, vê a pré-visualização, e baixa o arquivo", async ({
    page,
    request,
    browserName,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-artwork-generate");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await saveMinimalProfile(page, `e2e-artwork-generate-${Date.now()}`);
    await createPropertyWithPhoto(page);

    const nav = page.getByRole("tablist", { name: "Etapas do cadastro" });
    await nav.getByRole("tab", { name: "Artes", exact: true }).click();

    await expect(page.getByText("Nenhuma arte gerada ainda para este imóvel.")).toBeVisible();

    await page.getByLabel("Formato").selectOption("SQUARE_FEED");
    await page.getByLabel("Tipo de anúncio").selectOption("NEW_PROPERTY");
    await page.getByRole("button", { name: "Gerar arte" }).click();

    await expect(page.getByText("Arte gerada.")).toBeVisible();
    await expect(page.getByText("Nenhuma arte gerada ainda para este imóvel.")).not.toBeVisible();
    await expect(page.getByRole("img", { name: /Pré-visualização da arte/ })).toBeVisible();

    const downloadLink = page.getByRole("link", { name: "Baixar arte" });

    if (browserName === "webkit") {
      // RF-065: o WebKit do Linux (usado no CI) não dispara de forma
      // confiável o evento nativo "download" do navegador para uma
      // navegação com `Content-Disposition: attachment` — limitação
      // conhecida do Playwright com WebKit em Linux, que não reproduz
      // no Safari real (macOS/iOS, onde ninguém roda em Linux). Chromium
      // e Firefox (e o Chromium do projeto "mobile") já cobrem a
      // verificação completa via evento de download; aqui o mesmo
      // contrato é verificado diretamente pela resposta HTTP, usando a
      // sessão do próprio navegador (cookies compartilhados via
      // `page.request`), sem depender do mecanismo que falha.
      const href = await downloadLink.getAttribute("href");
      const response = await page.request.get(href!);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-disposition"]).toMatch(
        /^attachment; filename="arte-.*\.jpg"/,
      );
    } else {
      const downloadPromise = page.waitForEvent("download");
      await downloadLink.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/^arte-.*\.jpg$/);
    }

    await deleteTestUserByEmail(email);
  });
});
