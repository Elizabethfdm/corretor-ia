import { formatCurrencyBRL } from "@/lib/money/format-currency";
import type { PublicProperty } from "@/server/services/catalog-service";

interface PropertyCardProps {
  property: PublicProperty;
}

/**
 * Cartão de imóvel do catálogo público. Ainda não é um link clicável
 * para uma página individual — essa página chega na Fase 6. Por
 * enquanto o cartão é só informativo (ver docs/evidence/fase-05-...).
 */
export function PropertyCard({ property }: PropertyCardProps) {
  const specs = [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.bathrooms ? `${property.bathrooms} banheiros` : null,
    property.parkingSpaces ? `${property.parkingSpaces} vagas` : null,
    property.totalArea ? `${property.totalArea} m²` : null,
  ].filter(Boolean);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {property.coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
        <img
          src={property.coverPhotoUrl}
          alt={property.coverPhotoAlt ?? property.title}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          Sem foto
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {property.featured ? (
          <span className="w-fit rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Destaque
          </span>
        ) : null}

        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{property.title}</h3>

        <p className="text-sm text-zinc-500">
          {property.propertyType} · {property.purpose}
        </p>

        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          {property.showPrice ? formatCurrencyBRL(property.price) || "Valor não informado" : "Consulte o valor"}
        </p>

        {specs.length > 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{specs.join(" · ")}</p>
        ) : null}

        {property.neighborhood || property.city ? (
          <p className="text-sm text-zinc-500">
            {[property.neighborhood, property.city].filter(Boolean).join(" — ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}
