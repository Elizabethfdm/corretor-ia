import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}

export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação"
      className={cn("flex items-center justify-center gap-4 pt-4", className)}
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-sm text-neutral-400 dark:text-neutral-600"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </span>
      )}

      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Página {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
        >
          Próxima
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-sm text-neutral-400 dark:text-neutral-600"
          aria-disabled="true"
        >
          Próxima
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
