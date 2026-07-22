"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { editAdvertisementAction } from "@/features/advertisements/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  ADVERTISEMENT_CHANNEL_LABELS,
  ADVERTISEMENT_STATUS_LABELS,
  ADVERTISEMENT_TONE_LABELS,
} from "@/lib/advertisement/labels";
import type { GeneratedAdvertisement } from "@/generated/prisma/client";

interface AdvertisementCardProps {
  advertisement: GeneratedAdvertisement;
  propertyId: string;
}

const TEXTAREA_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

/**
 * RN-068: sinaliza claramente que o conteúdo foi gerado por IA.
 * RF-057: editável antes de copiar/compartilhar. RN-066: nunca publica
 * nada sozinho — só copia texto para a área de transferência.
 */
export function AdvertisementCard({ advertisement, propertyId }: AdvertisementCardProps) {
  const [state, formAction] = useActionState(editAdvertisementAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  const errors = state.fieldErrors ?? {};

  async function handleCopy() {
    const text = [advertisement.title, advertisement.content, advertisement.callToAction]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    window.setTimeout(() => setCopyFeedback(false), 3000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-950 dark:text-purple-300">
          Gerado por IA
        </span>
        <span className="text-xs text-zinc-500">
          {ADVERTISEMENT_CHANNEL_LABELS[advertisement.channel]} ·{" "}
          {ADVERTISEMENT_TONE_LABELS[advertisement.tone]} ·{" "}
          {ADVERTISEMENT_STATUS_LABELS[advertisement.status]}
        </span>
      </div>

      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="advertisementId" value={advertisement.id} />
        <input type="hidden" name="propertyId" value={propertyId} />

        <FormField id={`title-${advertisement.id}`} label="Título" errors={errors["title"]}>
          <input
            name="title"
            type="text"
            defaultValue={advertisement.title}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </FormField>

        <FormField id={`content-${advertisement.id}`} label="Texto" errors={errors["content"]}>
          <textarea
            name="content"
            rows={5}
            defaultValue={advertisement.content}
            className={TEXTAREA_CLASS}
          />
        </FormField>

        <FormField
          id={`cta-${advertisement.id}`}
          label="Chamada para ação"
          errors={errors["callToAction"]}
        >
          <input
            name="callToAction"
            type="text"
            defaultValue={advertisement.callToAction}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </FormField>

        <FormField
          id={`hashtags-${advertisement.id}`}
          label="Hashtags (separadas por vírgula)"
          errors={errors["hashtags"]}
        >
          <input
            name="hashtags"
            type="text"
            defaultValue={advertisement.hashtags.join(", ")}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <SubmitButton className="w-auto px-4 py-2 text-sm">Salvar edição</SubmitButton>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {copyFeedback ? "Copiado!" : "Copiar texto"}
          </button>
        </div>
      </form>
    </div>
  );
}
