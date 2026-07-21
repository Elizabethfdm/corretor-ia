import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { createTestUser, deleteTestUserByEmail, uniqueEmail } from "./helpers/test-users";
import { loginAs } from "./helpers/auth";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "test-avatar.png");

async function publishCatalog(page: Page, slug: string): Promise<void> {
  await page.goto("/painel/perfil");
  await page.getByLabel("Nome profissional").fill("Corretor Teste");
  await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
  await page.getByLabel("Endereço do catálogo (slug)").fill(slug);
  await page.getByLabel("Número do CRECI").fill("12345");
  await page.getByLabel("Estado do CRECI (UF)").fill("SP");
  await page.getByLabel("WhatsApp").fill("11999999999");
  await page.getByLabel("Cidade de atuação").fill("São Paulo");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
  await page.getByRole("button", { name: "Publicar catálogo" }).click();
  await expect(page.getByText("Catálogo publicado.")).toBeVisible();
}

async function createAndPublishProperty(page: Page, title: string): Promise<string> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);
  const propertyId = page.url().split("/painel/imoveis/")[1]!;

  await page.getByLabel("Título interno").fill(title);
  await page.getByLabel("Título público (opcional)").fill(title);
  await page.getByLabel("Finalidade").selectOption("SALE");
  await page.getByLabel("Tipo do imóvel").selectOption("HOUSE");
  await page.getByLabel("Valor (R$)").fill("450000");
  await page.getByRole("button", { name: "Salvar informações básicas" }).click();
  await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Etapas do cadastro" });
  await nav.getByRole("button", { name: "Localização", exact: true }).click();
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByLabel("Bairro").fill("Jardim Europa");
  await page.getByRole("button", { name: "Salvar localização" }).click();
  await expect(page.getByText("Localização salva.")).toBeVisible();

  await nav.getByRole("button", { name: "Fotos", exact: true }).click();
  await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
  await page.getByRole("button", { name: "Enviar fotos" }).click();
  await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();

  await nav.getByRole("button", { name: "Descrição", exact: true }).click();
  await page.getByLabel("Descrição completa").fill("Uma bela casa para o relatório de teste.");
  await page.getByRole("button", { name: "Salvar descrição" }).click();
  await expect(page.getByText("Descrição salva.")).toBeVisible();

  await nav.getByRole("button", { name: "Revisão e publicação", exact: true }).click();
  await page.getByRole("button", { name: "Publicar catálogo" }).click();
  await expect(page.getByText("Imóvel publicado.")).toBeVisible();

  return propertyId;
}

test.describe("Relatórios (RN-082 a RN-090)", () => {
  test("registra eventos de visitante e de ações do corretor, e exibe agregado no relatório", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(120_000);

    // Permissão de clipboard só é reconhecida pelo Chromium — em
    // Firefox/WebKit a chamada não é suportada e é ignorada (best
    // effort), já que `navigator.clipboard.writeText` costuma funcionar
    // sem permissão explícita nesses motores durante um gesto real do
    // usuário (o `.click()` do Playwright dispara um evento confiável).
    try {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    } catch {
      // Ignorado — permissão não suportada neste motor de navegador.
    }

    const email = uniqueEmail("e2e-reports");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-reports-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);
    await createAndPublishProperty(page, "Casa para relatório");

    // Visitante: catalog_view, property_view, whatsapp_click (contato do
    // catálogo), share_click, copy_link.
    await page.goto(`/catalogo/${slug}`);
    await expect(page.getByRole("heading", { name: "Corretor Teste" })).toBeVisible();

    const [catalogWhatsappPopup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("link", { name: "Falar no WhatsApp" }).click(),
    ]);
    await catalogWhatsappPopup.close();

    await page.getByRole("link", { name: /Casa para relatório/ }).click();
    await expect(page).toHaveURL(/\/catalogo\/[^/]+\/[^/]+$/);

    await page.getByRole("button", { name: "Copiar link" }).click();
    await expect(page.getByText("Link copiado!")).toBeVisible();

    const [sharePopup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: "Compartilhar no WhatsApp" }).click(),
    ]);
    await sharePopup.close();

    // Corretor: ad_generated e art_generated.
    await page.goto("/painel/imoveis");
    await page.getByRole("link", { name: /Casa para relatório/ }).click();
    await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

    const nav = page.getByRole("navigation", { name: "Etapas do cadastro" });
    await nav.getByRole("button", { name: "Anúncios com IA", exact: true }).click();
    await page.getByLabel("Canal").selectOption("INSTAGRAM");
    await page.getByLabel("Tom").selectOption("PROFESSIONAL");
    await page.getByLabel("Objetivo do anúncio").fill("Atrair famílias jovens");
    await page.getByRole("button", { name: "Gerar anúncio com IA" }).click();
    await expect(page.getByText("Anúncio gerado.")).toBeVisible();

    await nav.getByRole("button", { name: "Artes", exact: true }).click();
    await page.getByLabel("Tipo de anúncio").selectOption("NEW_PROPERTY");
    await page.getByRole("button", { name: "Gerar arte" }).click();
    await expect(page.getByText("Arte gerada.")).toBeVisible();

    // Relatório: todos os indicadores refletem as interações acima.
    await page.goto("/painel/relatorios");
    await expect(page.getByText("Visualizações do catálogo")).toBeVisible();

    const counters: Record<string, number> = {};
    for (const label of [
      "Visualizações do catálogo",
      "Visualizações de imóveis",
      "Cliques no WhatsApp",
      "Compartilhamentos",
      "Links copiados",
      "Anúncios gerados",
      "Artes geradas",
    ]) {
      const value = await page
        .getByText(label)
        .locator("xpath=preceding-sibling::p[1]")
        .textContent();
      counters[label] = Number(value);
    }

    expect(counters["Visualizações do catálogo"]).toBeGreaterThanOrEqual(1);
    expect(counters["Visualizações de imóveis"]).toBeGreaterThanOrEqual(1);
    expect(counters["Cliques no WhatsApp"]).toBeGreaterThanOrEqual(1);
    expect(counters["Compartilhamentos"]).toBeGreaterThanOrEqual(1);
    expect(counters["Links copiados"]).toBeGreaterThanOrEqual(1);
    expect(counters["Anúncios gerados"]).toBe(1);
    expect(counters["Artes geradas"]).toBe(1);

    await expect(page.getByText("Imóvel mais acessado no período")).toBeVisible();
    await expect(page.getByText("Casa para relatório")).toBeVisible();

    // RF-068: filtro por período continua mostrando os dados de hoje.
    await page.getByLabel("Período").selectOption("today");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Anúncios gerados")).toBeVisible();
    await expect(page.getByText("Nenhum dado registrado")).not.toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("mostra estado vazio quando o corretor ainda não tem nenhum dado (RN-088)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-reports-empty");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });

    await loginAs(page, email, "senha1234");
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome profissional").fill("Corretor Teste");
    await page.getByLabel("Nome completo").fill("Corretor Teste Completo");
    await page.getByLabel("Endereço do catálogo (slug)").fill(`e2e-reports-empty-${Date.now()}`);
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    await page.goto("/painel/relatorios");
    await expect(page.getByText("Nenhum dado registrado para o período selecionado.")).toBeVisible();

    await deleteTestUserByEmail(email);
  });
});
