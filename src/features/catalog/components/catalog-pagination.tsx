import Link from "next/link";
import { buildCatalogQueryString, type CatalogFilters } from "@/lib/validation/catalog-filters";

interface CatalogPaginationProps {
  slug: string;
  filters: CatalogFilters;
  page: number;
  totalPages: number;
}

/** RN-047: cada página preserva os demais filtros aplicados na URL. */
export function CatalogPagination({ slug, filters, page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousHref = `/catalogo/${slug}${buildCatalogQueryString(filters, { page: page - 1 })}`;
  const nextHref = `/catalogo/${slug}${buildCatalogQueryString(filters, { page: page + 1 })}`;

  return (
    <nav aria-label="Paginação do catálogo" className="flex items-center justify-center gap-4 pt-4">
      {page > 1 ? (
        <Link href={previousHref} className="text-sm underline">
          Anterior
        </Link>
      ) : (
        <span className="text-sm text-zinc-400" aria-disabled="true">
          Anterior
        </span>
      )}

      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Página {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={nextHref} className="text-sm underline">
          Próxima
        </Link>
      ) : (
        <span className="text-sm text-zinc-400" aria-disabled="true">
          Próxima
        </span>
      )}
    </nav>
  );
}
