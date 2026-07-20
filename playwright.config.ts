import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env["APP_URL"] ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "accessibility/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Desktop — motores principais (RNF-045)
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
    // Mobile e tablet (RNF-002) — validados no motor Chromium
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    env: {
      // "next start" força NODE_ENV=production; esta flag distingue o
      // build de produção usado para os testes E2E de uma produção real,
      // evitando que o rate limiting de autenticação (RN-008) derrube a
      // suíte sob execução concorrente. Nunca definida fora deste
      // arquivo — ver nota em src/lib/auth/auth.ts.
      E2E_DISABLE_RATE_LIMIT: "true",
    },
  },
});
