"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveLocationAction } from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { ADDRESS_VISIBILITY_LABELS } from "@/lib/property/labels";
import { AddressVisibility } from "@/generated/prisma/enums";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface LocationFormProps {
  property: SerializedProperty;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export function LocationForm({ property }: LocationFormProps) {
  const [state, formAction] = useActionState(saveLocationAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLInputElement>(null);
  const neighborhoodRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "not-found" | "filled">("idle");

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  async function handleZipBlur(event: React.FocusEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepStatus("loading");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await response.json()) as ViaCepResponse;

      if (data.erro) {
        setCepStatus("not-found");
        return;
      }

      if (streetRef.current && data.logradouro) streetRef.current.value = data.logradouro;
      if (neighborhoodRef.current && data.bairro) neighborhoodRef.current.value = data.bairro;
      if (cityRef.current && data.localidade) cityRef.current.value = data.localidade;
      if (stateRef.current && data.uf) stateRef.current.value = data.uf;
      setCepStatus("filled");
    } catch {
      setCepStatus("not-found");
    }
  }

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="zipCode" label="CEP" errors={errors["zipCode"]}>
          <Input
            name="zipCode"
            type="text"
            placeholder="01310-100"
            defaultValue={property.address?.zipCode ?? ""}
            onBlur={handleZipBlur}
            aria-describedby="zipCode-status"
          />
        </FormField>
        <div className="flex items-end pb-2 text-sm" id="zipCode-status" role="status" aria-live="polite">
          {cepStatus === "loading" && <span className="text-zinc-500">Buscando endereço...</span>}
          {cepStatus === "filled" && (
            <span className="text-green-700 dark:text-green-400">Endereço preenchido pelo CEP.</span>
          )}
          {cepStatus === "not-found" && (
            <span className="text-amber-700 dark:text-amber-400">
              CEP não encontrado — preencha manualmente.
            </span>
          )}
        </div>
      </div>

      <FormField id="street" label="Logradouro" errors={errors["street"]}>
        <Input
          ref={streetRef}
          name="street"
          type="text"
          maxLength={150}
          defaultValue={property.address?.street ?? ""}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="number" label="Número (opcional)" errors={errors["number"]}>
          <Input name="number" type="text" maxLength={20} defaultValue={property.address?.number ?? ""} />
        </FormField>
        <FormField id="complement" label="Complemento (opcional)" errors={errors["complement"]}>
          <Input
            name="complement"
            type="text"
            maxLength={100}
            defaultValue={property.address?.complement ?? ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="neighborhood" label="Bairro" errors={errors["neighborhood"]}>
          <Input
            ref={neighborhoodRef}
            name="neighborhood"
            type="text"
            maxLength={100}
            defaultValue={property.address?.neighborhood ?? ""}
          />
        </FormField>
        <FormField id="city" label="Cidade" errors={errors["city"]}>
          <Input
            ref={cityRef}
            name="city"
            type="text"
            maxLength={100}
            defaultValue={property.address?.city ?? ""}
          />
        </FormField>
        <FormField id="state" label="Estado (UF)" errors={errors["state"]}>
          <Input
            ref={stateRef}
            name="state"
            type="text"
            maxLength={2}
            defaultValue={property.address?.state ?? ""}
          />
        </FormField>
      </div>

      <FormField id="referencePoint" label="Ponto de referência (opcional)" errors={errors["referencePoint"]}>
        <Input
          name="referencePoint"
          type="text"
          maxLength={150}
          defaultValue={property.address?.referencePoint ?? ""}
        />
      </FormField>

      <FormField id="visibilityType" label="Privacidade do endereço" errors={errors["visibilityType"]}>
        <Select
          name="visibilityType"
          defaultValue={property.address?.visibilityType ?? AddressVisibility.HIDDEN_EXACT}
        >
          {Object.values(AddressVisibility).map((value) => (
            <option key={value} value={value}>
              {ADDRESS_VISIBILITY_LABELS[value]}
            </option>
          ))}
        </Select>
      </FormField>

      <SubmitButton pendingLabel="Salvando...">Salvar localização</SubmitButton>
    </form>
  );
}
