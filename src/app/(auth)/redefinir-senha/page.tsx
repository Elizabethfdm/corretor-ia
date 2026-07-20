import type { Metadata } from "next";
import Link from "next/link";
import { FormMessage } from "@/components/ui/form-message";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha — Corretor IA",
};

interface RedefinirSenhaPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function RedefinirSenhaPage({ searchParams }: RedefinirSenhaPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Link inválido
        </h1>
        <FormMessage
          status="error"
          message="Este link de redefinição de senha é inválido ou está incompleto. Solicite um novo."
        />
        <p className="mt-4 text-center text-sm">
          <Link href="/recuperar-senha" className="underline">
            Solicitar novo link
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Redefinir senha
      </h1>
      <ResetPasswordForm token={token} />
    </>
  );
}
