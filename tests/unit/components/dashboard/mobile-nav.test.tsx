import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileNav } from "@/features/dashboard/components/mobile-nav";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn(() => "/painel") }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("MobileNav", () => {
  it("abre o drawer com os itens de navegação e fecha ao clicar em Fechar", async () => {
    const user = userEvent.setup();
    render(<MobileNav isAdmin={false} />);

    expect(screen.queryByRole("link", { name: "Meus imóveis" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));

    expect(screen.getByRole("link", { name: "Meus imóveis" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Administração" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar menu" }));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Meus imóveis" })).not.toBeInTheDocument();
    });
  });

  it("mostra o item Administração para administradores", async () => {
    const user = userEvent.setup();
    render(<MobileNav isAdmin={true} />);

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));

    expect(screen.getByRole("link", { name: "Administração" })).toBeInTheDocument();
  });

  it("fecha o drawer ao navegar (onNavigate)", async () => {
    const user = userEvent.setup();
    render(<MobileNav isAdmin={false} />);

    await user.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));
    await user.click(screen.getByRole("link", { name: "Meus imóveis" }));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Meus imóveis" })).not.toBeInTheDocument();
    });
  });
});
