import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    globals: false,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/generated/**", "src/app/**/layout.tsx", "src/app/**/page.tsx"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.{test,spec}.{ts,tsx}"],
          // Testes de integração fazem I/O real (Postgres, MinIO) e hashing
          // real (bcrypt via better-auth); com muitos arquivos em paralelo
          // o padrão de 5s do Vitest estoura só por contenção de recursos.
          testTimeout: 15000,
          hookTimeout: 15000,
        },
      },
    ],
  },
});
