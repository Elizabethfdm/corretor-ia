"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import {
  deletePhotoAction,
  movePhotoAction,
  setCoverPhotoAction,
  setPhotoAltTextAction,
  uploadPhotosAction,
} from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface PhotoManagerProps {
  property: SerializedProperty;
}

function confirmDeletion(event: FormEvent<HTMLFormElement>): void {
  if (!confirm("Remover esta foto? Essa ação não pode ser desfeita.")) {
    event.preventDefault();
  }
}

export function PhotoManager({ property }: PhotoManagerProps) {
  const [state, formAction] = useActionState(uploadPhotosAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") {
      messageRef.current?.focus();
      if (state.status === "success") {
        formRef.current?.reset();
      }
    }
  }, [state]);

  const media = property.media;

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="propertyId" value={property.id} />

        {state.status !== "idle" && state.message ? (
          <div ref={messageRef} tabIndex={-1}>
            <FormMessage
              status={state.status === "error" ? "error" : "success"}
              message={state.message}
            />
          </div>
        ) : null}

        <label htmlFor="photo-files" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Adicionar fotos
        </label>
        <input
          id="photo-files"
          name="files"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          capture="environment"
          className="text-sm text-zinc-700 dark:text-zinc-300"
        />
        <SubmitButton pendingLabel="Enviando..." className="w-auto px-4 py-2 text-sm">
          Enviar fotos
        </SubmitButton>
      </form>

      {media.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma foto adicionada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {media.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
              <img
                src={item.publicUrl}
                alt={item.altText ?? ""}
                className="aspect-square w-full rounded object-cover"
              />

              <form action={setPhotoAltTextAction} className="flex flex-col gap-1">
                <input type="hidden" name="propertyId" value={property.id} />
                <input type="hidden" name="mediaId" value={item.id} />
                <label htmlFor={`alt-text-${item.id}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                  Texto alternativo (acessibilidade/SEO)
                </label>
                <div className="flex gap-1">
                  <input
                    id={`alt-text-${item.id}`}
                    name="altText"
                    type="text"
                    maxLength={200}
                    defaultValue={item.altText ?? ""}
                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>

              {item.isCover ? (
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-center text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                  Capa
                </span>
              ) : (
                <form action={setCoverPhotoAction}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="mediaId" value={item.id} />
                  <button type="submit" className="w-full text-xs underline">
                    Definir como capa
                  </button>
                </form>
              )}

              <div className="flex items-center justify-between gap-1">
                <form action={movePhotoAction}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="mediaId" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Mover foto para cima"
                    className="rounded border border-zinc-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-zinc-700"
                  >
                    ↑
                  </button>
                </form>
                <form action={movePhotoAction}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="mediaId" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === media.length - 1}
                    aria-label="Mover foto para baixo"
                    className="rounded border border-zinc-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-zinc-700"
                  >
                    ↓
                  </button>
                </form>
                <form action={deletePhotoAction} onSubmit={confirmDeletion}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="mediaId" value={item.id} />
                  <button
                    type="submit"
                    aria-label="Remover foto"
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 dark:border-red-800 dark:text-red-400"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
