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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Adicionar fotos</CardTitle>
        </CardHeader>
        <CardContent>
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

            <label
              htmlFor="photo-files"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Selecionar fotos
            </label>
            <input
              id="photo-files"
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              capture="environment"
              className="text-sm text-neutral-700 dark:text-neutral-300"
            />
            <SubmitButton pendingLabel="Enviando..." className="w-auto px-4 py-2 text-sm">
              Enviar fotos
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {media.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nenhuma foto adicionada ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, index) => (
            <li key={item.id}>
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/3] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
                  <img
                    src={item.publicUrl}
                    alt={item.altText ?? ""}
                    className="h-full w-full object-cover"
                  />
                  {item.isCover ? (
                    <Badge variant="primary" className="absolute top-2 left-2">
                      Capa
                    </Badge>
                  ) : null}
                </div>

                <CardContent className="flex flex-col gap-3 p-4">
                  <form action={setPhotoAltTextAction} className="flex flex-col gap-1">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="mediaId" value={item.id} />
                    <label
                      htmlFor={`alt-text-${item.id}`}
                      className="text-xs text-neutral-600 dark:text-neutral-400"
                    >
                      Texto alternativo (acessibilidade/SEO)
                    </label>
                    <div className="flex gap-1">
                      <input
                        id={`alt-text-${item.id}`}
                        name="altText"
                        type="text"
                        maxLength={200}
                        defaultValue={item.altText ?? ""}
                        className="w-full rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <Button type="submit" variant="outline" size="sm" className="shrink-0">
                        Salvar
                      </Button>
                    </div>
                  </form>

                  {!item.isCover ? (
                    <form action={setCoverPhotoAction}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="mediaId" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm" className="w-full">
                        Definir como capa
                      </Button>
                    </form>
                  ) : null}

                  <div className="flex items-center justify-between gap-1">
                    <form action={movePhotoAction}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="mediaId" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={index === 0}
                        aria-label="Mover foto para cima"
                      >
                        ↑
                      </Button>
                    </form>
                    <form action={movePhotoAction}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="mediaId" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={index === media.length - 1}
                        aria-label="Mover foto para baixo"
                      >
                        ↓
                      </Button>
                    </form>
                    <form action={deletePhotoAction} onSubmit={confirmDeletion}>
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="mediaId" value={item.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        aria-label="Remover foto"
                      >
                        Remover
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
