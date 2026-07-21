import { ARTWORK_FORMAT_LABELS, ARTWORK_TEMPLATE_TYPE_LABELS } from "@/lib/artwork/labels";
import type { GeneratedArtwork } from "@/generated/prisma/client";

interface ArtworkCardProps {
  artwork: GeneratedArtwork;
}

/** RN-079: pré-visualização sempre visível; RF-065/RN-080: download em qualidade adequada. */
export function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>{ARTWORK_FORMAT_LABELS[artwork.format]}</span>
        <span aria-hidden="true">·</span>
        <span>{ARTWORK_TEMPLATE_TYPE_LABELS[artwork.templateType]}</span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
      <img
        src={artwork.outputUrl}
        alt={`Pré-visualização da arte: ${artwork.title}`}
        className="w-full max-w-xs rounded-md object-contain"
      />

      <a
        href={`/api/artwork/${artwork.id}/download`}
        className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Baixar arte
      </a>
    </div>
  );
}
