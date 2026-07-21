import { AdvertisementCard } from "@/features/advertisements/components/advertisement-card";
import type { GeneratedAdvertisement } from "@/generated/prisma/client";

interface AdvertisementHistoryProps {
  advertisements: GeneratedAdvertisement[];
  propertyId: string;
}

/** RF-058: histórico de anúncios gerados para o imóvel. */
export function AdvertisementHistory({ advertisements, propertyId }: AdvertisementHistoryProps) {
  if (advertisements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nenhum anúncio gerado ainda para este imóvel.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {advertisements.map((advertisement) => (
        <AdvertisementCard key={advertisement.id} advertisement={advertisement} propertyId={propertyId} />
      ))}
    </div>
  );
}
