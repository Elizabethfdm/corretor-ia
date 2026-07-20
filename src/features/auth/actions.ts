"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { recordAuditLog } from "@/server/services/audit-log-service";
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { fieldErrorsFromZod, type ActionState } from "@/features/auth/action-state";
import { mapResetPasswordError, mapSignInError, mapSignUpError } from "@/features/auth/errors";

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: formData.get("termsAccepted") === "on",
    privacyAccepted: formData.get("privacyAccepted") === "on",
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    await recordAuditLog({
      userId: result.user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: result.user.id,
    });
  } catch (error) {
    return {
      status: "error",
      message: mapSignUpError(error, { email: parsed.data.email }),
    };
  }

  redirect("/painel");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    await recordAuditLog({
      userId: result.user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: result.user.id,
    });
  } catch (error) {
    return {
      status: "error",
      message: mapSignInError(error, { email: parsed.data.email }),
    };
  }

  redirect("/painel");
}

export async function logoutAction(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  await auth.api.signOut({ headers: await headers() });

  if (session) {
    await recordAuditLog({
      userId: session.user.id,
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: session.user.id,
    });
  }

  redirect("/login");
}

const GENERIC_PASSWORD_RESET_MESSAGE =
  "Se o e-mail informado estiver cadastrado, você receberá um link de redefinição de senha em instantes.";

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // RN-014: a resposta ao usuário é sempre a mesma, exista ou não o
  // e-mail cadastrado — mesmo que a chamada abaixo falhe internamente.
  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: "/redefinir-senha",
      },
    });
  } catch (error) {
    mapResetPasswordError(error, { email: parsed.data.email });
  }

  return { status: "success", message: GENERIC_PASSWORD_RESET_MESSAGE };
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: mapResetPasswordError(error),
    };
  }

  return {
    status: "success",
    message: "Senha redefinida com sucesso. Você já pode fazer login com a nova senha.",
  };
}
