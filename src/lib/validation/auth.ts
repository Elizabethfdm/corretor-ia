import { z } from "zod";

/**
 * RN-002: normaliza (trim + minúsculas) antes de validar o formato —
 * caso contrário, espaços digitados por engano reprovariam a validação
 * de e-mail antes de qualquer transformação ser aplicada.
 */
const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email({ error: "Informe um e-mail válido." }),
);

/**
 * RN-003: mínimo 8 caracteres (também reforçado pelo Better Auth) e
 * combinação mínima de tipos de caractere — exige ao menos uma letra e
 * um número, sem exigir símbolos (equilíbrio entre segurança e
 * usabilidade para o público-alvo do produto).
 */
const passwordSchema = z
  .string()
  .min(8, { error: "A senha deve ter no mínimo 8 caracteres." })
  .max(128, { error: "A senha deve ter no máximo 128 caracteres." })
  .regex(/(?=.*[A-Za-zÀ-ÿ])(?=.*\d)/, {
    error: "A senha deve conter ao menos uma letra e um número.",
  });

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { error: "Informe seu nome completo." })
      .max(150, { error: "Nome muito longo." }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      error: "É necessário aceitar os Termos de Uso.",
    }),
    privacyAccepted: z.literal(true, {
      error: "É necessário aceitar a Política de Privacidade.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmação de senha não coincide com a senha.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "Token de redefinição inválido." }),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "A confirmação de senha não coincide com a senha.",
    path: ["confirmNewPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
