"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { generateArtworkAction } from "@/features/artwork/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { ARTWORK_FORMAT_LABELS, ARTWORK_TEMPLATE_TYPE_LABELS } from "@/lib/artwork/labels";
import {
  buildDefaultArtworkCallToAction,
  buildDefaultArtworkSubtitle,
} from "@/lib/artwork/build-default-texts";
import { buildPublicTitle } from "@/lib/property/build-public-title";
import { ArtworkFormat, ArtworkTemplateType } from "@/generated/prisma/enums";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface ArtworkGeneratorFormProps {
  property: SerializedProperty;
}

const TEXT_INPUT_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

/** RF-062, RF-063: escolha de foto, formato, tipo de anúncio e edição dos textos exibidos. */
export function ArtworkGeneratorForm({ property }: ArtworkGeneratorFormProps) {
  const [state, formAction] = useActionState(generateArtworkAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);
  const coverPhoto = property.media.find((item) => item.isCover) ?? property.media[0];
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | undefined>(coverPhoto?.id);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  if (property.media.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Adicione ao menos uma foto ao imóvel (aba &quot;Fotos&quot;) antes de gerar uma arte.
      </p>
    );
  }

  const defaultTitle = buildPublicTitle(property);
  const defaultSubtitle = buildDefaultArtworkSubtitle({
    bedrooms: property.bedrooms,
    totalArea: property.totalArea,
    price: property.price,
    showPrice: property.showPrice,
  });
  const defaultCallToAction = buildDefaultArtworkCallToAction();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="propertyId" value={property.id} />

      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">Foto</legend>
        {errors["photoMediaId"] ? (
          <p className="text-sm text-red-600">{errors["photoMediaId"][0]}</p>
        ) : null}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {property.media.map((item, index) => (
            <label key={item.id} className="cursor-pointer">
              <input
                type="radio"
                name="photoMediaId"
                value={item.id}
                required
                aria-label={item.altText || `Foto ${index + 1}`}
                checked={selectedPhotoId === item.id}
                onChange={() => setSelectedPhotoId(item.id)}
                className="peer sr-only"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio */}
              <img
                src={item.thumbnailUrl ?? item.publicUrl}
                alt=""
                className="aspect-square w-full rounded-md object-cover ring-2 ring-transparent peer-checked:ring-zinc-900 dark:peer-checked:ring-zinc-50"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="format" label="Formato" errors={errors["format"]}>
          <Select name="format" required defaultValue={ArtworkFormat.SQUARE_FEED}>
            {Object.values(ArtworkFormat).map((value) => (
              <option key={value} value={value}>
                {ARTWORK_FORMAT_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="templateType" label="Tipo de anúncio" errors={errors["templateType"]}>
          <Select name="templateType" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {Object.values(ArtworkTemplateType).map((value) => (
              <option key={value} value={value}>
                {ARTWORK_TEMPLATE_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField id="title" label="Título" errors={errors["title"]}>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={70}
          defaultValue={defaultTitle}
          className={TEXT_INPUT_CLASS}
        />
      </FormField>

      <FormField id="subtitle" label="Subtítulo (opcional)" errors={errors["subtitle"]}>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          maxLength={110}
          defaultValue={defaultSubtitle}
          className={TEXT_INPUT_CLASS}
        />
      </FormField>

      <FormField id="callToAction" label="Chamada para ação" errors={errors["callToAction"]}>
        <input
          id="callToAction"
          name="callToAction"
          type="text"
          required
          maxLength={50}
          defaultValue={defaultCallToAction}
          className={TEXT_INPUT_CLASS}
        />
      </FormField>

      <SubmitButton pendingLabel="Gerando arte...">Gerar arte</SubmitButton>
    </form>
  );
}
