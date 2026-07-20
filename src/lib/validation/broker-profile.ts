import { z } from "zod";

/**
 * RN-020: slugs reservados que não podem ser usados como catálogo de um
 * corretor — evita colisão de significado com páginas do próprio site.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "cadastro",
  "api",
  "app",
  "suporte",
  "configuracoes",
  "catalogo",
  "painel",
  "recuperar-senha",
  "redefinir-senha",
  "acesso-negado",
  "termos-de-uso",
  "politica-de-privacidade",
]);

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const UF_REGEX = /^[A-Z]{2}$/;

/**
 * Converte string vazia (ou null, retornado por FormData.get para um
 * campo ausente) em undefined, para campos opcionais do formulário.
 */
function emptyToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalText(max: number) {
  return z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
}

function optionalUrl() {
  return z.preprocess(
    emptyToUndefined,
    z.url({ error: "Informe uma URL válida (começando com https://)." }).optional(),
  );
}

/** Combina emptyToUndefined com normalização para maiúsculas (UF). */
function normalizeUf(value: unknown): unknown {
  const withoutEmpty = emptyToUndefined(value);
  return typeof withoutEmpty === "string" ? withoutEmpty.trim().toUpperCase() : withoutEmpty;
}

/**
 * RN-019: apenas letras minúsculas, números e hífen; sem hífen duplo,
 * inicial ou final.
 */
export const slugSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z
    .string()
    .min(3, { error: "O slug deve ter pelo menos 3 caracteres." })
    .max(60, { error: "O slug deve ter no máximo 60 caracteres." })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Use apenas letras minúsculas, números e hífen (ex.: maria-silva-imoveis).",
    })
    .refine((value) => !RESERVED_SLUGS.has(value), {
      error: "Este slug não está disponível.",
    }),
);

export const brokerProfileSchema = z.object({
  professionalName: z
    .string()
    .trim()
    .min(2, { error: "Informe o nome profissional." })
    .max(150, { error: "Nome muito longo." }),
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Informe o nome completo." })
    .max(150, { error: "Nome muito longo." }),
  slug: slugSchema,
  creciNumber: optionalText(30),
  creciState: z.preprocess(
    normalizeUf,
    z.string().regex(UF_REGEX, { error: "Use a sigla do estado (ex.: SP)." }).optional(),
  ),
  phone: optionalText(20),
  whatsapp: optionalText(20),
  commercialEmail: z.preprocess(
    emptyToUndefined,
    z.email({ error: "Informe um e-mail válido." }).optional(),
  ),
  biography: optionalText(1000),
  city: optionalText(100),
  state: z.preprocess(
    normalizeUf,
    z.string().regex(UF_REGEX, { error: "Use a sigla do estado (ex.: SP)." }).optional(),
  ),
  businessAddress: optionalText(200),
  instagramUrl: optionalUrl(),
  facebookUrl: optionalUrl(),
  linkedinUrl: optionalUrl(),
  websiteUrl: optionalUrl(),
  primaryColor: z.preprocess(
    emptyToUndefined,
    z.string().regex(HEX_COLOR_REGEX, { error: "Use uma cor no formato #RRGGBB." }).optional(),
  ),
  secondaryColor: z.preprocess(
    emptyToUndefined,
    z.string().regex(HEX_COLOR_REGEX, { error: "Use uma cor no formato #RRGGBB." }).optional(),
  ),
});

export type BrokerProfileInput = z.infer<typeof brokerProfileSchema>;

/**
 * RN-016 a RN-018: campos exigidos apenas para publicar o catálogo, não
 * para salvar um rascunho de perfil.
 */
export function getPublicationRequirementErrors(profile: {
  creciNumber?: string | null;
  creciState?: string | null;
  whatsapp?: string | null;
  city?: string | null;
}): string[] {
  const errors: string[] = [];

  if (!profile.creciNumber) errors.push("Informe o número do CRECI.");
  if (!profile.creciState) errors.push("Informe o estado do CRECI.");
  if (!profile.whatsapp) errors.push("Informe o WhatsApp.");
  if (!profile.city) errors.push("Informe a cidade de atuação.");

  return errors;
}
