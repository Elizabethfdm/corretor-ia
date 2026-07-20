"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveCharacteristicsAction } from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FEATURE_LABELS } from "@/lib/property/labels";
import { FeatureType } from "@/generated/prisma/enums";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface CharacteristicsFormProps {
  property: SerializedProperty;
}

const BOOLEAN_FIELDS = [
  { name: "furnished", label: "Mobiliado" },
  { name: "petFriendly", label: "Aceita animais" },
  { name: "financingAccepted", label: "Aceita financiamento" },
  { name: "exchangeAccepted", label: "Aceita permuta" },
] as const;

export function CharacteristicsForm({ property }: CharacteristicsFormProps) {
  const [state, formAction] = useActionState(saveCharacteristicsAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const selectedFeatures = new Set(property.features.map((f) => f.featureType));

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="propertyId" value={property.id} />

      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField id="bedrooms" label="Quartos" errors={errors["bedrooms"]}>
          <Input
            name="bedrooms"
            type="number"
            min="0"
            defaultValue={property.bedrooms ?? ""}
          />
        </FormField>
        <FormField id="suites" label="Suítes" errors={errors["suites"]}>
          <Input name="suites" type="number" min="0" defaultValue={property.suites ?? ""} />
        </FormField>
        <FormField id="bathrooms" label="Banheiros" errors={errors["bathrooms"]}>
          <Input
            name="bathrooms"
            type="number"
            min="0"
            defaultValue={property.bathrooms ?? ""}
          />
        </FormField>
        <FormField id="parkingSpaces" label="Vagas" errors={errors["parkingSpaces"]}>
          <Input
            name="parkingSpaces"
            type="number"
            min="0"
            defaultValue={property.parkingSpaces ?? ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="totalArea" label="Área total (m²)" errors={errors["totalArea"]}>
          <Input
            name="totalArea"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property.totalArea ?? ""}
          />
        </FormField>
        <FormField id="builtArea" label="Área construída (m²)" errors={errors["builtArea"]}>
          <Input
            name="builtArea"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property.builtArea ?? ""}
          />
        </FormField>
        <FormField
          id="constructionYear"
          label="Ano de construção (opcional)"
          errors={errors["constructionYear"]}
        >
          <Input
            name="constructionYear"
            type="number"
            min="1800"
            defaultValue={property.constructionYear ?? ""}
          />
        </FormField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Condições
        </legend>
        {BOOLEAN_FIELDS.map((field) => (
          <label
            key={field.name}
            className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={property[field.name]}
              className="h-4 w-4"
            />
            {field.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Características adicionais
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.values(FeatureType).map((feature) => (
            <label
              key={feature}
              className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <input
                type="checkbox"
                name="features"
                value={feature}
                defaultChecked={selectedFeatures.has(feature)}
                className="h-4 w-4"
              />
              {FEATURE_LABELS[feature]}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Salvando...">Salvar características</SubmitButton>
    </form>
  );
}
