import { PropertyCard } from "@/features/catalog/components/property-card";
import type { PublicProperty } from "@/server/services/catalog-service";

interface CatalogGridProps {
  properties: PublicProperty[];
  hasActiveFilters: boolean;
  brokerSlug: string;
}

export function CatalogGrid({ properties, hasActiveFilters, brokerSlug }: CatalogGridProps) {
  if (properties.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {hasActiveFilters
          ? "Nenhum imóvel encontrado com esses filtros."
          : "Nenhum imóvel publicado ainda."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} brokerSlug={brokerSlug} />
      ))}
    </div>
  );
}
