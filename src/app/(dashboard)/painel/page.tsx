import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/policies/auth-policy";
import { getOwnProfile } from "@/server/services/broker-profile-service";
import { LogoutButton } from "@/features/auth/components/logout-button";

export const metadata: Metadata = {
  title: "Painel — Corretor IA",
};

export default async function PainelPage() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);

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

      {profile ? (
        <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{profile.professionalName}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Catálogo:{" "}
            <span className={profile.catalogEnabled ? "text-green-700 dark:text-green-400" : ""}>
              {profile.catalogEnabled ? "publicado" : "despublicado"}
            </span>
          </p>
          <Link href="/painel/perfil" className="text-sm underline">
            Editar perfil
          </Link>
          <Link href="/painel/relatorios" className="text-sm underline">
            Ver relatórios
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Complete seu perfil profissional para poder publicar seu catálogo digital.
          </p>
          <Link
            href="/painel/perfil"
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Completar perfil
          </Link>
        </section>
      )}

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Painel em construção — o cadastro de imóveis chega na próxima fase.
      </p>
    </div>
  );
}
