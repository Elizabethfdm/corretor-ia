import Link from "next/link";
import { BarChart3, Plus, UserCog } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const ACTIONS = [
  { href: "/painel/imoveis", label: "Novo imóvel", icon: Plus, variant: "primary" as const },
  { href: "/painel/perfil", label: "Editar perfil", icon: UserCog, variant: "outline" as const },
  {
    href: "/painel/relatorios",
    label: "Ver relatórios",
    icon: BarChart3,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(buttonVariants({ variant: action.variant, size: "sm" }))}
        >
          <action.icon className="h-4 w-4" aria-hidden="true" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
