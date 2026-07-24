import { Card, CardContent } from "@/components/ui/card";
import type { PlatformIndicators } from "@/server/services/admin-service";

interface PlatformIndicatorsProps {
  indicators: PlatformIndicators;
}

/** RF-075: indicadores gerais da plataforma. */
export function PlatformIndicatorsCards({ indicators }: PlatformIndicatorsProps) {
  const items = [
    { label: "Corretores cadastrados", value: indicators.totalBrokers },
    { label: "Imóveis cadastrados", value: indicators.totalProperties },
    { label: "Imóveis publicados", value: indicators.publishedProperties },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {item.value}
            </p>
            <p className="text-xs text-neutral-500">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
