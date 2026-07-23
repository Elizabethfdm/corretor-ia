"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { PublicPropertyPhoto } from "@/server/services/catalog-service";

interface PropertyGalleryProps {
  photos: PublicPropertyPhoto[];
  title: string;
}

/** Galeria com lightbox: clicar em qualquer foto abre em tela cheia, com navegação anterior/próxima. */
export function PropertyGallery({ photos, title }: PropertyGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
        Sem fotos
      </div>
    );
  }

  const [cover, ...rest] = photos;
  const current = openIndex !== null ? photos[openIndex] : null;

  function showPrev() {
    setOpenIndex((index) => (index === null ? null : (index - 1 + photos.length) % photos.length));
  }

  function showNext() {
    setOpenIndex((index) => (index === null ? null : (index + 1) % photos.length));
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="focus-visible:ring-primary-500 block w-full focus-visible:ring-2 focus-visible:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
          <img
            src={cover!.url}
            alt={cover!.alt ?? title}
            className="aspect-video w-full rounded-lg object-cover"
          />
        </button>

        {rest.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {rest.map((photo, index) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setOpenIndex(index + 1)}
                className="focus-visible:ring-primary-500 block focus-visible:ring-2 focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
                <img
                  src={photo.url}
                  alt={photo.alt ?? `${title} — foto ${index + 2}`}
                  className="aspect-square w-full rounded object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <DialogPrimitive.Root
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
            <DialogPrimitive.Title className="sr-only">
              {title} — foto ampliada
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="absolute top-4 right-4 rounded-md p-2 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </DialogPrimitive.Close>

            {current ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
              <img
                src={current.url}
                alt={current.alt ?? title}
                className="max-h-[85vh] max-w-full object-contain"
              />
            ) : null}

            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="Foto anterior"
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Próxima foto"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
