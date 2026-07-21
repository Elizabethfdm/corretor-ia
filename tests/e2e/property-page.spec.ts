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
  propertyType: string;
  price: string;
  city: string;
  neighborhood: string;
  street?: string;
  number?: string;
  fullAddress?: boolean;
  description: string;
}

async function createAndPublishProperty(page: Page, input: PropertyInput): Promise<string> {
  await page.goto("/painel/imoveis");
  await page.getByRole("button", { name: "Novo imóvel" }).click();
  await expect(page).toHaveURL(/\/painel\/imoveis\/[^/]+$/);
  const propertyId = page.url().split("/painel/imoveis/")[1]!;

  await page.getByLabel("Título interno").fill(input.title);
  await page.getByLabel("Título público (opcional)").fill(input.title);
  await page.getByLabel("Finalidade").selectOption("SALE");
  await page.getByLabel("Tipo do imóvel").selectOption(input.propertyType);
  await page.getByLabel("Valor (R$)").fill(input.price);
  await page.getByRole("button", { name: "Salvar informações básicas" }).click();
  await expect(page.getByText("Informações básicas salvas.")).toBeVisible();

  await page.getByRole("button", { name: "Localização" }).click();
  await page.getByLabel("Cidade", { exact: true }).fill(input.city);
  await page.getByLabel("Bairro").fill(input.neighborhood);
  if (input.street) await page.getByLabel("Logradouro").fill(input.street);
  if (input.number) await page.getByLabel("Número (opcional)").fill(input.number);
  if (input.fullAddress) {
    await page.getByLabel("Privacidade do endereço").selectOption("FULL_ADDRESS");
  }
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

  return propertyId;
}

test.describe("Página individual do imóvel (RN-051 a RN-060)", () => {
  test("visitante navega do catálogo ao imóvel, vê detalhes, contato e semelhantes", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const email = uniqueEmail("e2e-property-page");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-property-page-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);

    await createAndPublishProperty(page, {
      title: "Casa com piscina no Jardim Europa",
      propertyType: "HOUSE",
      price: "500000",
      city: "São Paulo",
      neighborhood: "Jardim Europa",
      street: "Rua das Flores",
      number: "100",
      fullAddress: true,
      description: "Uma casa maravilhosa com piscina e área gourmet.",
    });

    await createAndPublishProperty(page, {
      title: "Casa geminada na Vila Mariana",
      propertyType: "HOUSE",
      price: "480000",
      city: "São Paulo",
      neighborhood: "Vila Mariana",
      description: "Casa geminada, bem localizada.",
    });

    await page.goto(`/catalogo/${slug}`);
    await page.getByRole("link", { name: /Casa com piscina no Jardim Europa/ }).click();
    await expect(page).toHaveURL(/\/catalogo\/[^/]+\/[^/]+$/);

    await expect(page.getByRole("heading", { name: "Casa com piscina no Jardim Europa" })).toBeVisible();
    await expect(page.getByText("Uma casa maravilhosa com piscina e área gourmet.")).toBeVisible();
    await expect(page.getByText("Rua das Flores, 100")).toBeVisible();

    const contactLink = page.getByRole("link", { name: "Falar no WhatsApp" }).first();
    await expect(contactLink).toHaveAttribute("href", /^https:\/\/wa\.me\/5511999999999\?text=/);
    const contactHref = await contactLink.getAttribute("href");
    const contactMessage = decodeURIComponent(contactHref!.split("text=")[1]!);
    expect(contactMessage).toContain("Casa com piscina no Jardim Europa");
    expect(contactMessage).toContain("Corretor Teste");

    await expect(page.getByRole("heading", { name: "Imóveis semelhantes" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Casa geminada na Vila Mariana/ }),
    ).toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("oculta o endereço exato quando a privacidade está configurada para ocultar (RN-039, RN-040)", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-property-address-hidden");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-property-address-hidden-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);

    await createAndPublishProperty(page, {
      title: "Apartamento com endereço oculto",
      propertyType: "APARTMENT",
      price: "300000",
      city: "Curitiba",
      neighborhood: "Batel",
      street: "Rua Secreta",
      number: "999",
      fullAddress: false,
      description: "Apartamento completo.",
    });

    await page.goto(`/catalogo/${slug}`);
    await page.getByRole("link", { name: /Apartamento com endereço oculto/ }).click();

    await expect(page.getByText("Batel")).toBeVisible();
    await expect(page.getByText("Rua Secreta")).not.toBeVisible();

    await deleteTestUserByEmail(email);
  });

  test("compartilhar no WhatsApp abre uma nova aba com o link e o texto corretos", async ({
    page,
    request,
    context,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-property-share");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-property-share-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);
    await createAndPublishProperty(page, {
      title: "Casa para compartilhar",
      propertyType: "HOUSE",
      price: "400000",
      city: "São Paulo",
      neighborhood: "Centro",
      description: "Casa para teste de compartilhamento.",
    });

    await page.goto(`/catalogo/${slug}`);
    await page.getByRole("link", { name: /Casa para compartilhar/ }).click();
    await expect(page).toHaveURL(/\/catalogo\/[^/]+\/[^/]+$/);

    // Não aguarda o carregamento do popup: wa.me é um domínio externo
    // real (redireciona quase imediatamente para api.whatsapp.com, fora
    // do nosso controle) e esperar o carregamento completo depende da
    // infraestrutura do WhatsApp. `window.open` já define a URL de
    // destino de forma síncrona, então basta capturá-la assim que o
    // evento de nova página dispara, antes de qualquer redirecionamento.
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: "Compartilhar no WhatsApp" }).click(),
    ]);
    // `URLSearchParams` decodifica corretamente tanto "%20" quanto "+"
    // como espaço — a infraestrutura do WhatsApp reescreve a URL usando
    // "+" no redirecionamento, o que `decodeURIComponent` cru não trata.
    const shareText = new URL(popup.url()).searchParams.get("text")!;
    expect(shareText).toContain("Casa para compartilhar");
    await popup.close();

    await deleteTestUserByEmail(email);
  });

  test("imóvel despublicado ou inexistente retorna 404 para visitante (RN-032, RN-049)", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);

    const email = uniqueEmail("e2e-property-page-404");
    await createTestUser(request, { name: "Corretor Teste", email, password: "senha1234" });
    const slug = `e2e-property-page-404-${Date.now()}`;

    await loginAs(page, email, "senha1234");
    await publishCatalog(page, slug);

    const notFoundExisting = await page.request.get(`/catalogo/${slug}/imovel-que-nunca-existiu`);
    expect(notFoundExisting.status()).toBe(404);

    const propertyId = await createAndPublishProperty(page, {
      title: "Imóvel a despublicar",
      propertyType: "HOUSE",
      price: "350000",
      city: "São Paulo",
      neighborhood: "Centro",
      description: "Descrição qualquer.",
    });

    // Captura a URL pública real (com o sufixo aleatório do slug) antes de despublicar.
    await page.goto(`/catalogo/${slug}`);
    const publicHref = await page
      .getByRole("link", { name: /Imóvel a despublicar/ })
      .getAttribute("href");
    expect(publicHref).toMatch(new RegExp(`^/catalogo/${slug}/imovel-a-despublicar-[0-9a-f]{6}$`));

    await page.goto(`/painel/imoveis/${propertyId}`);
    await page.getByRole("button", { name: "Revisão e publicação" }).click();
    await page.getByRole("button", { name: "Despublicar" }).click();
    await expect(page.getByText("Imóvel despublicado.")).toBeVisible();

    const notFoundUnpublished = await page.request.get(publicHref!);
    expect(notFoundUnpublished.status()).toBe(404);

    await deleteTestUserByEmail(email);
  });
});
