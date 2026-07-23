import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/money/format-currency";
import type { PublicProperty } from "@/server/services/catalog-service";

interface PropertyCardProps {
  property: PublicProperty;
  brokerSlug: string;
}

export function PropertyCard({ property, brokerSlug }: PropertyCardProps) {
  const specs = [
    property.bedrooms ? `${property.bedrooms} quartos` : null,
    property.bathrooms ? `${property.bathrooms} banheiros` : null,
    property.parkingSpaces ? `${property.parkingSpaces} vagas` : null,
    property.totalArea ? `${property.totalArea} m²` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/catalogo/${brokerSlug}/${property.slug}`}
      className="block transition-shadow hover:shadow-md"
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-video w-full">
          {property.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
            <img
              src={property.coverPhotoUrl}
              alt={property.coverPhotoAlt ?? property.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              Sem foto
            </div>
          )}
          {property.featured ? (
            <Badge variant="warning" className="absolute top-2 left-2">
              Destaque
            </Badge>
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {property.title}
          </h3>

          <p className="text-sm text-neutral-500">
            {property.propertyType} · {property.purpose}
          </p>

          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
            {property.showPrice
              ? formatCurrencyBRL(property.price) || "Valor não informado"
              : "Consulte o valor"}
          </p>

          {specs.length > 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{specs.join(" · ")}</p>
          ) : null}

          {property.neighborhood || property.city ? (
            <p className="mt-auto text-sm text-neutral-500">
              {[property.neighborhood, property.city].filter(Boolean).join(" — ")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
