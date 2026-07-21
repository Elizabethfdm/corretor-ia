import { z } from "zod";
import { ArtworkFormat, ArtworkTemplateType } from "@/generated/prisma/enums";

/**
 * RF-062, RF-063: campos que o corretor escolhe/edita antes de gerar
 * uma arte. Os limites de caracteres (RN-077) garantem que o texto
 * sempre caiba na caixa do modelo mesmo no tamanho mínimo de fonte —
 * ver `composeArtwork` (ADR-0006).
 */
export const generateArtworkSchema = z.object({
  propertyId: z.string().trim().min(1, { error: "Selecione o imóvel." }),
  photoMediaId: z.string().trim().min(1, { error: "Selecione uma foto." }),
  format: z.enum(ArtworkFormat, { error: "Selecione o formato." }),
  templateType: z.enum(ArtworkTemplateType, { error: "Selecione o tipo de anúncio." }),
  title: z
    .string()
    .trim()
    .min(1, { error: "Informe um título." })
    .max(70, { error: "Título muito longo (máx. 70 caracteres)." }),
  subtitle: z
    .string()
    .trim()
    .max(110, { error: "Subtítulo muito longo (máx. 110 caracteres)." })
    .default(""),
  callToAction: z
    .string()
    .trim()
    .min(1, { error: "Informe a chamada para ação." })
    .max(50, { error: "Chamada para ação muito longa (máx. 50 caracteres)." }),
});

export type GenerateArtworkInput = z.infer<typeof generateArtworkSchema>;
