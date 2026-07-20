import { expect, test } from "@playwright/test";

test.describe("Fundação do projeto — smoke test", () => {
  test("a página inicial carrega e exibe o nome do produto", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Corretor IA" })).toBeVisible();
  });

  test("o endpoint de health check responde OK", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
