import type { PublicPropertyPhoto } from "@/server/services/catalog-service";

interface PropertyGalleryProps {
  photos: PublicPropertyPhoto[];
  title: string;
}

export function PropertyGallery({ photos, title }: PropertyGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        Sem fotos
      </div>
    );
  }

  const [cover, ...rest] = photos;

  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
      <img
        src={cover!.url}
        alt={cover!.alt ?? title}
        className="aspect-video w-full rounded-lg object-cover"
      />
      {rest.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {rest.map((photo, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.alt ?? `${title} — foto ${index + 2}`}
              className="aspect-square w-full rounded object-cover"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
