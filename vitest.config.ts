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
        },
      },
    ],
  },
});
