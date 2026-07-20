import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/policies/auth-policy";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Criar conta — Corretor IA",
};

export default async function CadastroPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/painel");
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Criar conta</h1>
      <RegisterForm />
    </>
  );
}
