"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CatalogFiltersForm } from "@/features/catalog/components/catalog-filters-form";
import type { CatalogFilters } from "@/lib/validation/catalog-filters";

interface CatalogFiltersDrawerProps {
  slug: string;
  filters: CatalogFilters;
}

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Mesmo formulário de filtros (GET nativo, RN-047) em dois lugares:
 * sempre visível no desktop, e atrás de um botão "Filtros" num drawer
 * no mobile/tablet (RNF-002). Só uma instância fica montada por vez —
 * escondê-la só com CSS deixaria duas cópias com o mesmo placeholder/
 * rótulo no DOM ao mesmo tempo (ambíguo para leitor de tela e para
 * testes). Sem JavaScript (ou antes da hidratação), mostra o
 * formulário inline — o mesmo comportamento de sempre, sem depender de
 * JS para funcionar.
 */
export function CatalogFiltersDrawer({ slug, filters }: CatalogFiltersDrawerProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (isDesktop) {
    return <CatalogFiltersForm slug={slug} filters={filters} />;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className="focus-visible:ring-primary-500 inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none dark:border-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-900">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtros
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg dark:bg-neutral-950">
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Filtros
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="focus-visible:ring-primary-500 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:outline-none dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <CatalogFiltersForm slug={slug} filters={filters} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
