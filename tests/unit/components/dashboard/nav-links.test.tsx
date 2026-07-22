import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NavLinks } from "@/features/dashboard/components/nav-links";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("NavLinks", () => {
  it("não mostra o item Administração para um corretor comum", () => {
    usePathname.mockReturnValue("/painel");
    render(<NavLinks isAdmin={false} />);

    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Administração" })).not.toBeInTheDocument();
  });

  it("mostra o item Administração para um administrador", () => {
    usePathname.mockReturnValue("/painel");
    render(<NavLinks isAdmin={true} />);

    expect(screen.getByRole("link", { name: "Administração" })).toBeInTheDocument();
  });

  it("marca o item correspondente à rota atual com aria-current", () => {
    usePathname.mockReturnValue("/painel/imoveis");
    render(<NavLinks isAdmin={false} />);

    expect(screen.getByRole("link", { name: "Meus imóveis" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Painel" })).not.toHaveAttribute("aria-current");
  });

  it("chama onNavigate ao clicar em um item (fecha o drawer mobile)", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/painel");
    const onNavigate = vi.fn();
    render(<NavLinks isAdmin={false} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("link", { name: "Meus imóveis" }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
