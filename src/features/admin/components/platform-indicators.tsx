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
        <div
          key={item.label}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{item.value}</p>
          <p className="text-xs text-zinc-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
