import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/policies/auth-policy";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar — Corretor IA",
};

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/painel");
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Entrar</h1>
      <LoginForm />
    </>
  );
}
