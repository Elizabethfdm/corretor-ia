"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  buildAdvertisementPromptAction,
  saveAdvertisementAction,
} from "@/features/advertisements/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { idleAdvertisementPromptState } from "@/lib/advertisement/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils/cn";
import { FEATURE_LABELS } from "@/lib/property/labels";
import {
  ADVERTISEMENT_CHANNEL_LABELS,
  ADVERTISEMENT_SIZE_LABELS,
  ADVERTISEMENT_TONE_LABELS,
} from "@/lib/advertisement/labels";
import { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";
import { ADVERTISEMENT_SIZES } from "@/lib/advertisement/types";
import type { SerializedProperty } from "@/features/properties/serialize-property";

const CHATGPT_URL = "https://chatgpt.com/";

const FIELD_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

interface AdvertisementGeneratorFormProps {
  property: SerializedProperty;
}

/** RF-054: seleção de imóvel (já fixo nesta tela), canal, objetivo, tom, tamanho, público-alvo e aspectos a destacar. */
export function AdvertisementGeneratorForm({ property }: AdvertisementGeneratorFormProps) {
  const [promptState, buildPromptAction] = useActionState(
    buildAdvertisementPromptAction,
    idleAdvertisementPromptState,
  );
  const [saveState, saveFormAction] = useActionState(saveAdvertisementAction, idleActionState);
  const [showResult, setShowResult] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const promptMessageRef = useRef<HTMLDivElement>(null);
  const saveMessageRef = useRef<HTMLDivElement>(null);

  function startOver() {
    setShowResult(false);
    setJustSaved(false);
  }

  // Ajusta `showResult`/`justSaved` durante a renderização (não num
  // efeito) ao detectar que o resultado de uma das duas Server Actions
  // mudou — evita o cascading render de chamar setState dentro de
  // useEffect. Um salvamento bem-sucedido NÃO volta direto para o
  // formulário inicial — mostra a confirmação até o corretor escolher
  // montar outro prompt, para a mensagem "Anúncio salvo." não
  // desaparecer no mesmo render em que aparece.
  const [lastPromptState, setLastPromptState] = useState(promptState);
  if (promptState !== lastPromptState) {
    setLastPromptState(promptState);
    if (promptState.status === "success" && promptState.prompt) {
      setShowResult(true);
      setJustSaved(false);
    }
  }

  const [lastSaveState, setLastSaveState] = useState(saveState);
  if (saveState !== lastSaveState) {
    setLastSaveState(saveState);
    if (saveState.status === "success") {
      setJustSaved(true);
    }
  }

  useEffect(() => {
    if (promptState.status !== "idle") promptMessageRef.current?.focus();
  }, [promptState]);

  useEffect(() => {
    if (saveState.status !== "idle") saveMessageRef.current?.focus();
  }, [saveState]);

  async function handleCopyPrompt() {
    if (!promptState.prompt) return;
    await navigator.clipboard.writeText(promptState.prompt);
    setCopyFeedback(true);
    window.setTimeout(() => setCopyFeedback(false), 3000);
  }

  if (showResult && promptState.prompt && promptState.selection) {
    if (justSaved) {
      return (
        <div className="flex flex-col gap-4">
          <div ref={saveMessageRef} tabIndex={-1}>
            <FormMessage status="success" message={saveState.message ?? "Anúncio salvo."} />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={startOver}>
            Montar outro prompt
          </Button>
        </div>
      );
    }

    const selection = promptState.selection;
    const saveErrors = saveState.fieldErrors ?? {};

    return (
      <div className="flex flex-col gap-4">
        <div ref={promptMessageRef} tabIndex={-1}>
          <FormMessage status="success" message={promptState.message ?? "Prompt pronto."} />
        </div>

        <FormField id="advertisement-prompt" label="Prompt para colar na ferramenta de IA">
          <textarea
            id="advertisement-prompt"
            readOnly
            rows={12}
            value={promptState.prompt}
            className={FIELD_CLASS}
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handleCopyPrompt}>
            {copyFeedback ? "Copiado!" : "Copiar prompt"}
          </Button>
          <a
            href={CHATGPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Abrir ChatGPT
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={startOver}>
            Montar outro prompt
          </Button>
        </div>

        <form
          action={saveFormAction}
          className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
        >
          <input type="hidden" name="propertyId" value={property.id} />
          <input type="hidden" name="channel" value={selection.channel} />
          <input type="hidden" name="tone" value={selection.tone} />
          <input type="hidden" name="size" value={selection.size} />
          <input type="hidden" name="objective" value={selection.objective} />
          {selection.targetAudience ? (
            <input type="hidden" name="targetAudience" value={selection.targetAudience} />
          ) : null}
          {selection.highlightAspects.map((aspect) => (
            <input key={aspect} type="hidden" name="highlightAspects" value={aspect} />
          ))}

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Depois de gerar o texto na ferramenta de IA, cole o resultado nos campos abaixo.
          </p>

          {saveState.status === "error" && saveState.message ? (
            <div ref={saveMessageRef} tabIndex={-1}>
              <FormMessage status="error" message={saveState.message} />
            </div>
          ) : null}

          <FormField id="title" label="Título" errors={saveErrors["title"]}>
            <input id="title" name="title" type="text" required className={FIELD_CLASS} />
          </FormField>

          <FormField id="content" label="Texto" errors={saveErrors["content"]}>
            <textarea id="content" name="content" rows={5} required className={FIELD_CLASS} />
          </FormField>

          <FormField
            id="callToAction"
            label="Chamada para ação"
            errors={saveErrors["callToAction"]}
          >
            <input
              id="callToAction"
              name="callToAction"
              type="text"
              required
              className={FIELD_CLASS}
            />
          </FormField>

          <FormField
            id="hashtags"
            label="Hashtags (separadas por vírgula, opcional)"
            errors={saveErrors["hashtags"]}
          >
            <input id="hashtags" name="hashtags" type="text" className={FIELD_CLASS} />
          </FormField>

          <SubmitButton pendingLabel="Salvando...">Salvar anúncio</SubmitButton>
        </form>
      </div>
    );
  }

  const promptErrors = promptState.fieldErrors ?? {};

  return (
    <form action={buildPromptAction} className="flex flex-col gap-4">
      <input type="hidden" name="propertyId" value={property.id} />

      {promptState.status === "error" && promptState.message ? (
        <div ref={promptMessageRef} tabIndex={-1}>
          <FormMessage status="error" message={promptState.message} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="channel" label="Canal" errors={promptErrors["channel"]}>
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

        <FormField id="tone" label="Tom" errors={promptErrors["tone"]}>
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

        <FormField id="size" label="Tamanho do texto" errors={promptErrors["size"]}>
          <Select name="size" required defaultValue="MEDIUM">
            {ADVERTISEMENT_SIZES.map((value) => (
              <option key={value} value={value}>
                {ADVERTISEMENT_SIZE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField id="objective" label="Objetivo do anúncio" errors={promptErrors["objective"]}>
        <input
          id="objective"
          name="objective"
          type="text"
          required
          maxLength={200}
          placeholder="Ex.: atrair famílias procurando o primeiro imóvel"
          className={FIELD_CLASS}
        />
      </FormField>

      <FormField
        id="targetAudience"
        label="Público-alvo (opcional)"
        errors={promptErrors["targetAudience"]}
      >
        <input
          id="targetAudience"
          name="targetAudience"
          type="text"
          maxLength={150}
          placeholder="Ex.: casais jovens, investidores, aposentados"
          className={FIELD_CLASS}
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

      <SubmitButton pendingLabel="Montando prompt...">Montar prompt com IA</SubmitButton>
    </form>
  );
}
