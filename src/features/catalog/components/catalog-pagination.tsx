import { Pagination } from "@/components/ui/pagination";
import { buildCatalogQueryString, type CatalogFilters } from "@/lib/validation/catalog-filters";

interface CatalogPaginationProps {
  slug: string;
  filters: CatalogFilters;
  page: number;
  totalPages: number;
}

/** RN-047: cada página preserva os demais filtros aplicados na URL. */
export function CatalogPagination({ slug, filters, page, totalPages }: CatalogPaginationProps) {
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      hrefFor={(target) => `/catalogo/${slug}${buildCatalogQueryString(filters, { page: target })}`}
    />
  );
}
