import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/database/prisma";
import { getEmailProvider } from "@/lib/email";
import { logger } from "@/lib/observability/logger";
import { recordAuditLog } from "@/server/services/audit-log-service";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

/**
 * Instância server do Better Auth (ADR-0002). Único ponto do projeto que
 * deve importar "better-auth" e seus adapters/plugins diretamente — todo
 * o restante da aplicação consome sessão/usuário via
 * `src/server/policies/auth-policy.ts`.
 */
export const auth = betterAuth({
  secret: requireEnv("AUTH_SECRET"),
  baseURL: process.env["APP_URL"] ?? "http://localhost:3000",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, token }) => {
      // Usamos "token" (não a "url" padrão do Better Auth, que aponta
      // para /api/auth/reset-password/:token e depende de um redirect
      // intermediário) para linkar direto à nossa página
      // /redefinir-senha, que já espera ?token=... (ver ResetPasswordForm).
      const resetUrl = `${process.env["APP_URL"] ?? "http://localhost:3000"}/redefinir-senha?token=${encodeURIComponent(token)}`;
      await getEmailProvider().send({
        to: user.email,
        subject: "Redefinição de senha — Corretor IA",
        text: `Olá! Recebemos uma solicitação para redefinir sua senha no Corretor IA. Se foi você, acesse o link a seguir para escolher uma nova senha: ${resetUrl}\n\nSe você não solicitou isso, pode ignorar este e-mail com segurança — sua senha atual continua válida.`,
      });
    },
    onPasswordReset: async ({ user }) => {
      await recordAuditLog({
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
      });
    },
    revokeSessionsOnPasswordReset: true,
  },

  user: {
    additionalFields: {
      termsAcceptedAt: {
        type: "date",
        input: false,
      },
      privacyAcceptedAt: {
        type: "date",
        input: false,
      },
    },
  },

  // RN-011: o cadastro só é concluído com aceite explícito dos Termos de
  // Uso e da Política de Privacidade. A validação dos aceites acontece
  // em server/services/auth-service.ts antes de chamar o Better Auth;
  // este hook apenas carimba a data/hora do aceite já validado.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const now = new Date();
          return {
            data: {
              ...user,
              termsAcceptedAt: now,
              privacyAcceptedAt: now,
            },
          };
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "broker",
      adminRoles: ["admin"],
      bannedUserMessage:
        "Sua conta foi bloqueada. Entre em contato com o suporte para mais informações.",
    }),
    // nextCookies precisa ser o último plugin: define automaticamente os
    // cookies de sessão em Server Actions e Route Handlers do App Router.
    nextCookies(),
  ],

  // RN-008: limites agressivos são corretos em produção, mas travariam
  // execuções concorrentes de testes automatizados (integração e E2E)
  // contra o mesmo servidor. "next start" sempre roda com
  // NODE_ENV=production internamente (inclusive quando o Playwright sobe
  // o servidor para os testes E2E), então usamos uma flag própria
  // (E2E_DISABLE_RATE_LIMIT, setada apenas em playwright.config.ts) para
  // distinguir "produção de verdade" de "build de produção usado em
  // teste". Ver nota de dívida técnica em docs/quality/test-strategy.md
  // sobre cobertura automatizada dedicada a rate limiting.
  rateLimit: {
    enabled:
      process.env.NODE_ENV === "production" && process.env["E2E_DISABLE_RATE_LIMIT"] !== "true",
    window: 60,
    max: 60,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  logger: {
    log: (level, message, ...args) => {
      const context = args.length > 0 ? { details: args } : undefined;
      if (level === "error") {
        logger.error(message, context);
      } else if (level === "warn") {
        logger.warn(message, context);
      } else {
        logger.debug(message, context);
      }
    },
  },
});

export type Auth = typeof auth;
