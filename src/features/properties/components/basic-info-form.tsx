"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveBasicInfoAction } from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";
import { PropertyPurpose, PropertyType } from "@/generated/prisma/enums";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface BasicInfoFormProps {
  property: SerializedProperty;
}

export function BasicInfoForm({ property }: BasicInfoFormProps) {
  const [state, formAction] = useActionState(saveBasicInfoAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

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

      <FormField id="internalTitle" label="Título interno" errors={errors["internalTitle"]}>
        <Input
          name="internalTitle"
          type="text"
          required
          maxLength={150}
          defaultValue={property.internalTitle}
        />
      </FormField>

      <FormField
        id="publicTitle"
        label="Título público (opcional)"
        errors={errors["publicTitle"]}
      >
        <Input
          name="publicTitle"
          type="text"
          maxLength={150}
          defaultValue={property.publicTitle ?? ""}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="purpose" label="Finalidade" errors={errors["purpose"]}>
          <Select name="purpose" required defaultValue={property.purpose}>
            {Object.values(PropertyPurpose).map((value) => (
              <option key={value} value={value}>
                {PURPOSE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="propertyType" label="Tipo do imóvel" errors={errors["propertyType"]}>
          <Select name="propertyType" required defaultValue={property.propertyType}>
            {Object.values(PropertyType).map((value) => (
              <option key={value} value={value}>
                {PROPERTY_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField id="referenceCode" label="Código de referência (opcional)" errors={errors["referenceCode"]}>
        <Input
          name="referenceCode"
          type="text"
          maxLength={30}
          defaultValue={property.referenceCode ?? ""}
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="showPrice"
          defaultChecked={property.showPrice}
          className="h-4 w-4"
        />
        Exibir valor (desmarque para &quot;Consulte o valor&quot;)
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="price" label="Valor (R$)" errors={errors["price"]}>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property.price ?? ""}
          />
        </FormField>
        <FormField id="condominiumFee" label="Condomínio (R$)" errors={errors["condominiumFee"]}>
          <Input
            name="condominiumFee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property.condominiumFee ?? ""}
          />
        </FormField>
        <FormField id="propertyTax" label="IPTU (R$)" errors={errors["propertyTax"]}>
          <Input
            name="propertyTax"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property.propertyTax ?? ""}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={property.featured}
          className="h-4 w-4"
        />
        Destacar este imóvel no catálogo
      </label>

      <SubmitButton pendingLabel="Salvando...">Salvar informações básicas</SubmitButton>
    </form>
  );
}
