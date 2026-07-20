import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Corretor IA
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Cadastre o imóvel uma vez, publique no seu catálogo digital, gere anúncios com IA, crie
        artes e compartilhe tudo pelo WhatsApp.
      </p>
      <div className="flex gap-3">
        <Link
          href="/cadastro"
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Criar conta
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Entrar
        </Link>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Projeto em construção — Fase 2 (Autenticação).
      </p>
    </main>
  );
}
