"use client";

import { useActionState, useEffect, useRef } from "react";
import { generateAdvertisementAction } from "@/features/advertisements/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FEATURE_LABELS } from "@/lib/property/labels";
import {
  ADVERTISEMENT_CHANNEL_LABELS,
  ADVERTISEMENT_SIZE_LABELS,
  ADVERTISEMENT_TONE_LABELS,
} from "@/lib/advertisement/labels";
import { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";
import { ADVERTISEMENT_SIZES } from "@/lib/ai/types";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface AdvertisementGeneratorFormProps {
  property: SerializedProperty;
}

/** RF-054: seleção de imóvel (já fixo nesta tela), canal, objetivo, tom, tamanho, público-alvo e aspectos a destacar. */
export function AdvertisementGeneratorForm({ property }: AdvertisementGeneratorFormProps) {
  const [state, formAction] = useActionState(generateAdvertisementAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="channel" label="Canal" errors={errors["channel"]}>
          <Select name="channel" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {Object.values(AdvertisementChannel).map((value) => (
              <option key={value} value={value}>
                {ADVERTISEMENT_CHANNEL_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="tone" label="Tom" errors={errors["tone"]}>
          <Select name="tone" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {Object.values(AdvertisementTone).map((value) => (
              <option key={value} value={value}>
                {ADVERTISEMENT_TONE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="size" label="Tamanho do texto" errors={errors["size"]}>
          <Select name="size" required defaultValue="MEDIUM">
            {ADVERTISEMENT_SIZES.map((value) => (
              <option key={value} value={value}>
                {ADVERTISEMENT_SIZE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField id="objective" label="Objetivo do anúncio" errors={errors["objective"]}>
        <input
          id="objective"
          name="objective"
          type="text"
          required
          maxLength={200}
          placeholder="Ex.: atrair famílias procurando o primeiro imóvel"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </FormField>

      <FormField
        id="targetAudience"
        label="Público-alvo (opcional)"
        errors={errors["targetAudience"]}
      >
        <input
          id="targetAudience"
          name="targetAudience"
          type="text"
          maxLength={150}
          placeholder="Ex.: casais jovens, investidores, aposentados"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </FormField>

      {property.features.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Aspectos a destacar (opcional)
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {property.features.map((feature) => (
              <label
                key={feature.id}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="checkbox"
                  name="highlightAspects"
                  value={FEATURE_LABELS[feature.featureType]}
                  className="h-4 w-4"
                />
                {FEATURE_LABELS[feature.featureType]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <SubmitButton pendingLabel="Gerando anúncio...">Gerar anúncio com IA</SubmitButton>
    </form>
  );
}
