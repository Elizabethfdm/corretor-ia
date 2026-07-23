import { z } from "zod";
import { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";
import { ADVERTISEMENT_SIZES } from "@/lib/advertisement/types";

function emptyToUndefined(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function toArray(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
}

/** RF-054: campos que o corretor escolhe antes de montar o prompt. */
export const buildAdvertisementPromptSchema = z.object({
  propertyId: z.string().trim().min(1, { error: "Selecione o imóvel." }),
  channel: z.enum(AdvertisementChannel, { error: "Selecione o canal." }),
  tone: z.enum(AdvertisementTone, { error: "Selecione o tom." }),
  size: z.enum(ADVERTISEMENT_SIZES, { error: "Selecione o tamanho do texto." }),
  objective: z
    .string()
    .trim()
    .min(3, { error: "Descreva o objetivo do anúncio." })
    .max(200, { error: "Objetivo muito longo." }),
  targetAudience: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
  highlightAspects: z.preprocess(toArray, z.array(z.string()).default([])),
});

export type BuildAdvertisementPromptInput = z.infer<typeof buildAdvertisementPromptSchema>;

const advertisementContentSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(200),
  content: z.string().trim().min(1, { error: "Informe o texto do anúncio." }),
  callToAction: z.string().trim().min(1, { error: "Informe a chamada para ação." }).max(200),
  hashtags: z.preprocess(toArray, z.array(z.string().trim().min(1)).default([])),
});

/**
 * RF-055: o que o corretor cola de volta depois de gerar o texto numa
 * ferramenta de IA externa (ex.: ChatGPT), junto da seleção original
 * (RF-058: mantida no histórico).
 */
export const saveAdvertisementSchema = buildAdvertisementPromptSchema.extend({
  ...advertisementContentSchema.shape,
});

export type SaveAdvertisementInput = z.infer<typeof saveAdvertisementSchema>;

/** RF-057: o corretor pode editar o resultado salvo a qualquer momento. */
export const editAdvertisementSchema = advertisementContentSchema;

export type EditAdvertisementInput = z.infer<typeof editAdvertisementSchema>;
