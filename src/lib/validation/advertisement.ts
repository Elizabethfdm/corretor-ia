import { z } from "zod";
import { AdvertisementChannel, AdvertisementTone } from "@/generated/prisma/enums";
import { ADVERTISEMENT_SIZES } from "@/lib/ai/types";

function emptyToUndefined(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function toArray(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
}

/** RF-054: campos que o corretor escolhe antes de gerar um anúncio. */
export const generateAdvertisementSchema = z.object({
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

export type GenerateAdvertisementInput = z.infer<typeof generateAdvertisementSchema>;

/** RF-057: o corretor pode editar o resultado gerado antes de salvar. */
export const editAdvertisementSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(200),
  content: z.string().trim().min(1, { error: "Informe o texto do anúncio." }),
  callToAction: z.string().trim().min(1, { error: "Informe a chamada para ação." }).max(200),
  hashtags: z.preprocess(toArray, z.array(z.string().trim().min(1)).default([])),
});

export type EditAdvertisementInput = z.infer<typeof editAdvertisementSchema>;

/**
 * Formato esperado da resposta do provedor de IA — validado antes de
 * ser aceito (RN-071): uma resposta que não valida contra este schema
 * é tratada como falha do provedor, nunca aceita às cegas.
 */
export const advertisementOutputSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1),
  callToAction: z.string().trim().min(1).max(300),
  hashtags: z.array(z.string().trim().min(1)).default([]),
});
