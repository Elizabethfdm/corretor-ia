import { PropertyCard } from "@/features/catalog/components/property-card";
import type { PublicProperty } from "@/server/services/catalog-service";

interface SimilarPropertiesProps {
  brokerSlug: string;
  properties: PublicProperty[];
}

/** RN-053: sempre restrito ao mesmo corretor e a imóveis disponíveis (garantido no service). */
export function SimilarProperties({ brokerSlug, properties }: SimilarPropertiesProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Imóveis semelhantes</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} brokerSlug={brokerSlug} />
        ))}
      </div>
    </section>
  );
}
