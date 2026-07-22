import "dotenv/config";
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `globals: false` em vitest.config.ts desativa a limpeza automática do
// Testing Library entre testes (ela depende de detectar `afterEach`
// global) — sem isto, renders de um teste vazam para o próximo dentro
// do mesmo arquivo.
afterEach(() => {
  cleanup();
});
