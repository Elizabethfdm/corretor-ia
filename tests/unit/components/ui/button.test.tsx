import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza como variante primária por padrão", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" }).className).toContain("bg-primary-600");
  });

  it("aplica as classes da variante solicitada", () => {
    render(<Button variant="destructive">Excluir</Button>);
    expect(screen.getByRole("button", { name: "Excluir" }).className).toContain("bg-danger-600");
  });

  it("aplica as classes do tamanho solicitado", () => {
    render(<Button size="sm">Pequeno</Button>);
    expect(screen.getByRole("button", { name: "Pequeno" }).className).toContain("h-8");
  });

  it("mescla className extra sem perder as classes da variante", () => {
    render(<Button className="mt-4">Continuar</Button>);
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button.className).toContain("mt-4");
    expect(button.className).toContain("bg-primary-600");
  });
});
