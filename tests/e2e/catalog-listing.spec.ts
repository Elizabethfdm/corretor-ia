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

interface PropertyInput {
  title: string;
  purpose: "SALE" | "RENT";
  propertyType: string;
  price: string;
  city: string;
  neighborhood: string;
  description: string;
}

async function createAndPublishProperty(page: Page, input: PropertyInput): Promise<void> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);

  await page.getByLabel("Título interno").fill(input.title);
  await page.getByLabel("Título público (opcional)").fill(input.title);
  await page.getByLabel("Finalidade").selectOption(input.purpose);
  await page.getByLabel("Tipo do imóvel").selectOption(input.propertyType);
  await page.getByLabel("Valor (R$)").fill(input.price);
  await page.getByRole("button", { name: "Salvar informações básicas" }).click();
  await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

  await page.getByRole("button", { name: "Localização" }).click();
  await page.getByLabel("Cidade", { exact: true }).fill(input.city);
  await page.getByLabel("Bairro").fill(input.neighborhood);
  await page.getByRole("button", { name: "Salvar localização" }).click();
  await expect(page.getByText("Localização salva.")).toBeVisible();

  await page.getByRole("button", { name: "Fotos" }).click();
  await page.locator('input[type="file"]#photo-files').setInputFiles(FIXTURE_PATH);
  await page.getByRole("button", { name: "Enviar fotos" }).click();
  await expect(page.getByText("1 foto(s) enviada(s) com sucesso.")).toBeVisible();

  await page.getByRole("button", { name: "Descrição" }).click();
  await page.getByLabel("Descrição completa").fill(input.description);
  await page.getByRole("button", { name: "Salvar descrição" }).click();
  await expect(page.getByText("Descrição salva.")).toBeVisible();

  await page.getByRole("button", { name: "Revisão e publicação" }).click();
  await page.getByRole("button", { name: "Publicar catálogo" }).click();
  await expect(page.getByText("Imóvel publicado.")).toBeVisible();
}

test.describe("Catálogo digital (RN-046 a RN-050)", () => {
  test("visitante vê apenas imóveis disponíveis e pode buscar, filtrar e ordenar", async ({
    page,
    request,
  }) => {
    // Cenário cria e publica 3 imóveis via UI em sequência — mais lento
    // que um cenário típico, precisa de mais orçamento que o padrão.
    test.setTimeout(120_000);

    const email = uniqueEmail("e2e-catalog-listing");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-catalog-listing-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);

    await createAndPublishProperty(page, {
      title: "Casa com piscina no Jardim Europa",
      purpose: "SALE",
      propertyType: "HOUSE",
      price: "500000",
      city: "São Paulo",
      neighborhood: "Jardim Europa",
      description: "Uma casa maravilhosa com piscina.",
    });

    await createAndPublishProperty(page, {
      title: "Apartamento para alugar na Vila Mariana",
      purpose: "RENT",
      propertyType: "APARTMENT",
      price: "2500",
      city: "São Paulo",
      neighborhood: "Vila Mariana",
      description: "Apartamento compacto e bem localizado.",
    });

    // Cria um segundo imóvel e o marca como reservado — não deve
    // aparecer no catálogo público (RN-046).
    await createAndPublishProperty(page, {
      title: "Cobertura reservada",
      purpose: "SALE",
      propertyType: "PENTHOUSE",
      price: "1200000",
      city: "São Paulo",
      neighborhood: "Itaim Bibi",
      description: "Cobertura de alto padrão.",
    });
    await page.getByRole("button", { name: "Marcar como reservado" }).click();
    await expect(page.getByText('Status alterado para "Reservado".')).toBeVisible();

    await page.goto(`/catalogo/${slug}`);

    await expect(page.getByText("Casa com piscina no Jardim Europa")).toBeVisible();
    await expect(page.getByText("Apartamento para alugar na Vila Mariana")).toBeVisible();
    await expect(page.getByText("Cobertura reservada")).not.toBeVisible();
    await expect(page.getByText("2 imóveis encontrados")).toBeVisible();

    // Busca por termo livre.
    await page.getByPlaceholder("Buscar por título, descrição, bairro ou cidade").fill("piscina");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/q=piscina/);
    await expect(page.getByText("Casa com piscina no Jardim Europa")).toBeVisible();
    await expect(page.getByText("Apartamento para alugar na Vila Mariana")).not.toBeVisible();
    await expect(page.getByText("1 imóvel encontrado")).toBeVisible();

    // A URL com o filtro é compartilhável — recarregar reproduz o resultado.
    await page.reload();
    await expect(page.getByText("Casa com piscina no Jardim Europa")).toBeVisible();
    await expect(page.getByText("1 imóvel encontrado")).toBeVisible();

    // Filtro por finalidade a partir de uma navegação limpa.
    await page.goto(`/catalogo/${slug}`);
    await page.getByLabel("Finalidade").selectOption("RENT");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/purpose=RENT/);
    await expect(page.getByText("Apartamento para alugar na Vila Mariana")).toBeVisible();
    await expect(page.getByText("Casa com piscina no Jardim Europa")).not.toBeVisible();

    // Ordenação por menor preço.
    await page.goto(`/catalogo/${slug}`);
    await page.getByLabel("Ordenar por").selectOption("price_asc");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/sort=price_asc/);
    const cardTitles = page.locator("article h3");
    await expect(cardTitles.first()).toHaveText("Apartamento para alugar na Vila Mariana");

    await deleteTestUserByEmail(email);
  });

  test("mostra mensagem apropriada quando o catálogo não tem imóveis publicados", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-catalog-empty");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-catalog-empty-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);

    await page.goto(`/catalogo/${slug}`);
    await expect(page.getByText("Nenhum imóvel publicado ainda.")).toBeVisible();

    await deleteTestUserByEmail(email);
  });
});
