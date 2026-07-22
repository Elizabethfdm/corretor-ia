import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ExemploTabs() {
  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="midia">Mídia</TabsTrigger>
      </TabsList>
      <TabsContent value="dados">Conteúdo de dados</TabsContent>
      <TabsContent value="midia">Conteúdo de mídia</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("mostra o painel da aba padrão", () => {
    render(<ExemploTabs />);
    expect(screen.getByText("Conteúdo de dados")).toBeVisible();
    expect(screen.queryByText("Conteúdo de mídia")).not.toBeInTheDocument();
  });

  it("troca o painel ativo ao clicar em outra aba", async () => {
    const user = userEvent.setup();
    render(<ExemploTabs />);

    await user.click(screen.getByRole("tab", { name: "Mídia" }));

    expect(screen.getByText("Conteúdo de mídia")).toBeVisible();
    expect(screen.queryByText("Conteúdo de dados")).not.toBeInTheDocument();
  });

  it("navega entre abas com as setas do teclado", async () => {
    const user = userEvent.setup();
    render(<ExemploTabs />);

    screen.getByRole("tab", { name: "Dados" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Mídia" })).toHaveFocus();
    expect(screen.getByText("Conteúdo de mídia")).toBeVisible();
  });
});
