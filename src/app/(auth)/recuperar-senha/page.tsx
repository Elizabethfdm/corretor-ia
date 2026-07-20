import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/policies/auth-policy";
import { RequestPasswordResetForm } from "@/features/auth/components/request-password-reset-form";

export const metadata: Metadata = {
  title: "Recuperar senha — Corretor IA",
};

export default async function RecuperarSenhaPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/painel");
  }

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Recuperar senha
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Informe o e-mail da sua conta para receber um link de redefinição de senha.
      </p>
      <RequestPasswordResetForm />
    </>
  );
}
