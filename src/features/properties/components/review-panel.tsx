"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import {
  changeStatusAction,
  deletePropertyAction,
  duplicatePropertyAction,
} from "@/features/properties/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils/cn";
import { formatCurrencyBRL } from "@/lib/money/format-currency";
import {
  ADDRESS_VISIBILITY_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
} from "@/lib/property/labels";
import { getPropertyPublicationRequirementErrors } from "@/lib/validation/property";
import type { PropertyStatus } from "@/generated/prisma/enums";
import type { SerializedProperty } from "@/features/properties/serialize-property";

interface ReviewPanelProps {
  property: SerializedProperty;
}

const STATUS_BADGE_VARIANT: Record<PropertyStatus, "neutral" | "success" | "warning" | "primary"> =
  {
    DRAFT: "neutral",
    AVAILABLE: "success",
    RESERVED: "warning",
    SOLD: "primary",
    RENTED: "primary",
    INACTIVE: "neutral",
  };

const OUTLINE_SUBMIT_CLASS = cn(buttonVariants({ variant: "outline", size: "md" }), "w-auto");

function confirmDeletion(event: FormEvent<HTMLFormElement>): void {
  if (
    !confirm(
      "Excluir este imóvel? Ele poderá ser restaurado depois, mas sairá do catálogo imediatamente.",
    )
  ) {
    event.preventDefault();
  }
}

export function ReviewPanel({ property }: ReviewPanelProps) {
  // Publicar, despublicar e as demais mudanças de status (reservar,
  // vender, alugar) são todas o mesmo action (changeStatusAction),
  // diferenciadas pelo campo oculto "status" — um único useActionState
  // evita a ambiguidade de qual mensagem mostrar quando mais de um
  // botão de ciclo de vida já foi usado na mesma sessão.
  const [state, statusFormAction] = useActionState(changeStatusAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const cover = property.media.find((m) => m.isCover) ?? property.media[0];
  const missingForPublication = getPropertyPublicationRequirementErrors({
    internalTitle: property.internalTitle,
    price: property.price,
    showPrice: property.showPrice,
    city: property.address?.city,
    neighborhood: property.address?.neighborhood,
    description: property.description,
    mediaCount: property.media.length,
  });

  const canPublish = property.status === "DRAFT" || property.status === "INACTIVE";
  const canUnpublish = !canPublish && property.status !== "DRAFT";
  const canMarkReserved = property.status === "AVAILABLE";
  const canMarkSold = property.status === "AVAILABLE" || property.status === "RESERVED";
  const canMarkRented = property.status === "AVAILABLE" || property.status === "RESERVED";

  return (
    <div className="flex flex-col gap-6">
      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
              <img
                src={cover.publicUrl}
                alt={cover.altText ?? ""}
                className="h-32 w-full rounded object-cover sm:w-48"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-500 sm:w-48 dark:border-neutral-700 dark:text-neutral-400">
                Sem foto
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {property.publicTitle || property.internalTitle}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {PURPOSE_LABELS[property.purpose]} · {PROPERTY_TYPE_LABELS[property.propertyType]}
              </p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {property.showPrice
                  ? formatCurrencyBRL(property.price) || "Valor não informado"
                  : "Consulte o valor"}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {[
                  property.bedrooms && `${property.bedrooms} quartos`,
                  property.bathrooms && `${property.bathrooms} banheiros`,
                  property.parkingSpaces && `${property.parkingSpaces} vagas`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Características não informadas"}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {property.address?.neighborhood ?? "Bairro não informado"} —{" "}
                {property.address?.city ?? "Cidade não informada"}
                {property.address
                  ? ` (${ADDRESS_VISIBILITY_LABELS[property.address.visibilityType]})`
                  : ""}
              </p>
              <div className="mt-1">
                <Badge variant={STATUS_BADGE_VARIANT[property.status]}>
                  {PROPERTY_STATUS_LABELS[property.status]}
                </Badge>
              </div>
            </div>
          </div>

          {property.description ? (
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              {property.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {missingForPublication.length > 0 ? (
        <div className="border-warning-300 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200 rounded-md border px-4 py-3 text-sm">
          <p className="font-medium">Pendente para publicação:</p>
          <ul className="list-disc pl-5">
            {missingForPublication.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {canPublish ? (
          <form action={statusFormAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="AVAILABLE" />
            <SubmitButton className="w-auto px-4 py-2 text-sm">Publicar catálogo</SubmitButton>
          </form>
        ) : null}

        {canUnpublish ? (
          <form action={statusFormAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="INACTIVE" />
            <SubmitButton className={OUTLINE_SUBMIT_CLASS}>Despublicar</SubmitButton>
          </form>
        ) : null}

        {canMarkReserved ? (
          <form action={statusFormAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="RESERVED" />
            <SubmitButton className={OUTLINE_SUBMIT_CLASS}>Marcar como reservado</SubmitButton>
          </form>
        ) : null}

        {canMarkSold ? (
          <form action={statusFormAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="SOLD" />
            <SubmitButton className={OUTLINE_SUBMIT_CLASS}>Marcar como vendido</SubmitButton>
          </form>
        ) : null}

        {canMarkRented ? (
          <form action={statusFormAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="RENTED" />
            <SubmitButton className={OUTLINE_SUBMIT_CLASS}>Marcar como alugado</SubmitButton>
          </form>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <form action={duplicatePropertyAction}>
          <input type="hidden" name="propertyId" value={property.id} />
          <button type="submit" className="text-sm underline">
            Duplicar imóvel
          </button>
        </form>

        <form action={deletePropertyAction} onSubmit={confirmDeletion}>
          <input type="hidden" name="propertyId" value={property.id} />
          <button type="submit" className="text-danger-600 dark:text-danger-400 text-sm underline">
            Excluir imóvel
          </button>
        </form>

        <Link href="/painel/imoveis" className="text-sm underline">
          Voltar à lista
        </Link>
      </div>
    </div>
  );
}
