import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ExemploDialog() {
  return (
    <Dialog>
      <DialogTrigger>Abrir diálogo</DialogTrigger>
      <DialogContent>
        <DialogTitle>Título do diálogo</DialogTitle>
        <DialogDescription>Descrição do diálogo</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("abre ao clicar no gatilho e fecha com Esc, devolvendo o foco ao gatilho (RNF-019)", async () => {
    const user = userEvent.setup();
    render(<ExemploDialog />);

    const trigger = screen.getByRole("button", { name: "Abrir diálogo" });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Título do diálogo" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it("fecha ao clicar no botão de fechar", async () => {
    const user = userEvent.setup();
    render(<ExemploDialog />);

    await user.click(screen.getByRole("button", { name: "Abrir diálogo" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
