"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveDescriptionAction } from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface DescriptionFormProps {
  property: SerializedProperty;
}

const TEXTAREA_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function DescriptionForm({ property }: DescriptionFormProps) {
  const [state, formAction] = useActionState(saveDescriptionAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="propertyId" value={property.id} />

      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Texto do anúncio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField id="description" label="Descrição completa" errors={errors["description"]}>
            <textarea
              name="description"
              rows={6}
              maxLength={5000}
              defaultValue={property.description ?? ""}
              className={TEXTAREA_CLASS}
            />
          </FormField>

          <FormField id="highlights" label="Diferenciais (opcional)" errors={errors["highlights"]}>
            <textarea
              name="highlights"
              rows={3}
              maxLength={2000}
              defaultValue={property.highlights ?? ""}
              className={TEXTAREA_CLASS}
            />
          </FormField>

          <FormField
            id="nearbyPlaces"
            label="Proximidades (opcional)"
            errors={errors["nearbyPlaces"]}
          >
            <textarea
              name="nearbyPlaces"
              rows={3}
              maxLength={2000}
              defaultValue={property.nearbyPlaces ?? ""}
              className={TEXTAREA_CLASS}
            />
          </FormField>

          <FormField
            id="commercialConditions"
            label="Condições comerciais (opcional)"
            errors={errors["commercialConditions"]}
          >
            <textarea
              name="commercialConditions"
              rows={3}
              maxLength={2000}
              defaultValue={property.commercialConditions ?? ""}
              className={TEXTAREA_CLASS}
            />
          </FormField>

          <FormField
            id="internalNotes"
            label="Observações internas (opcional — nunca aparece no catálogo público)"
            errors={errors["internalNotes"]}
          >
            <textarea
              name="internalNotes"
              rows={3}
              maxLength={2000}
              defaultValue={property.internalNotes ?? ""}
              className={TEXTAREA_CLASS}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id="seoTitle" label="SEO title (opcional)" errors={errors["seoTitle"]}>
              <Input
                name="seoTitle"
                type="text"
                maxLength={70}
                defaultValue={property.seoTitle ?? ""}
              />
            </FormField>
            <FormField
              id="seoDescription"
              label="SEO description (opcional)"
              errors={errors["seoDescription"]}
            >
              <Input
                name="seoDescription"
                type="text"
                maxLength={160}
                defaultValue={property.seoDescription ?? ""}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <SubmitButton pendingLabel="Salvando...">Salvar descrição</SubmitButton>
    </form>
  );
}
