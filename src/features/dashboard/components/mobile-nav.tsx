"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { NavLinks } from "@/features/dashboard/components/nav-links";

interface MobileNavProps {
  isAdmin: boolean;
}

/**
 * Menu de navegação em drawer para telas pequenas (RNF-002) — usa o
 * primitivo Radix Dialog diretamente (não o `Dialog` genérico de
 * `components/ui`) porque o layout de gaveta lateral é visualmente
 * distinto do modal centralizado padrão.
 */
export function MobileNav({ isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Abrir menu de navegação"
        className="focus-visible:ring-primary-500 rounded-md p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none md:hidden dark:text-neutral-400 dark:hover:bg-neutral-900"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          aria-label="Navegação principal"
          className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white p-4 shadow-lg dark:bg-neutral-950"
        >
          <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Corretor IA
            </span>
            <DialogPrimitive.Close
              aria-label="Fechar menu"
              className="focus-visible:ring-primary-500 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:outline-none dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
