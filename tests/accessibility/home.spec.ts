import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Acessibilidade — página inicial", () => {
  test("não possui violações WCAG A/AA detectáveis automaticamente", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    expect(results.violations).toEqual([]);
  });
});
