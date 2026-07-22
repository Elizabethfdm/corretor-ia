import Link from "next/link";

import { NavLinks } from "@/features/dashboard/components/nav-links";

interface SidebarProps {
  isAdmin: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 md:flex dark:border-neutral-800">
      <div className="px-4 py-5">
        <Link
          href="/painel"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
        >
          Corretor IA
        </Link>
      </div>
      <nav aria-label="Navegação principal" className="flex-1 px-2">
        <NavLinks isAdmin={isAdmin} />
      </nav>
    </aside>
  );
}
