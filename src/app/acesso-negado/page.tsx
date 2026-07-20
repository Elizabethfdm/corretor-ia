import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acesso negado — Corretor IA",
};

export default function AcessoNegadoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Acesso negado</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Você não tem permissão para acessar esta página.
      </p>
      <Link href="/painel" className="underline">
        Voltar ao painel
      </Link>
    </main>
  );
}
