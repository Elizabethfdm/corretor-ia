"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, Home, ShieldCheck, User } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const BASE_ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: Home },
  { href: "/painel/imoveis", label: "Meus imóveis", icon: Building2 },
  { href: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/painel/perfil", label: "Meu perfil", icon: User },
];

const ADMIN_ITEM: NavItem = { href: "/painel-admin", label: "Administração", icon: ShieldCheck };

interface NavLinksProps {
  isAdmin: boolean;
  className?: string;
  onNavigate?: () => void;
}

/** Itens de navegação do painel, compartilhados entre a sidebar (desktop) e o drawer (mobile). */
export function NavLinks({ isAdmin, className, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        const isActive =
          item.href === "/painel" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
