import type { Metadata } from "next";
import { requireUser } from "@/server/policies/auth-policy";
import { LogoutButton } from "@/features/auth/components/logout-button";

export const metadata: Metadata = {
  title: "Painel — Corretor IA",
};

export default async function PainelPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Olá, {user.name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
        </div>
        <LogoutButton />
      </header>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Painel em construção — o cadastro de perfil profissional e de imóveis chega nas próximas
        fases.
      </p>
    </div>
  );
}
