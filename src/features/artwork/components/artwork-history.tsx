import { ArtworkCard } from "@/features/artwork/components/artwork-card";
import type { GeneratedArtwork } from "@/generated/prisma/client";

interface ArtworkHistoryProps {
  artworks: GeneratedArtwork[];
}

/** Histórico de artes geradas para o imóvel. */
export function ArtworkHistory({ artworks }: ArtworkHistoryProps) {
  if (artworks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nenhuma arte gerada ainda para este imóvel.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}
