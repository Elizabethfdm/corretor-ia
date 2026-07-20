import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Corretor IA",
};

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Termos de Uso</h1>
      <p className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Este documento é um modelo inicial e ainda não passou por revisão jurídica. Não deve ser
        considerado definitivo para operação comercial.
      </p>
      <div className="flex flex-col gap-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          Ao criar uma conta no Corretor IA, você concorda em utilizar a plataforma para cadastrar e
          divulgar imóveis de sua responsabilidade profissional, fornecendo informações verdadeiras
          e atualizadas.
        </p>
        <p>
          O Corretor IA oferece ferramentas de cadastro de imóveis, catálogo digital,
          compartilhamento, geração de anúncios com inteligência artificial e criação de artes para
          redes sociais. O conteúdo gerado por inteligência artificial deve sempre ser revisado por
          você antes de ser publicado ou compartilhado.
        </p>
        <p>
          Você é responsável pela veracidade dos dados dos imóveis cadastrados, pela posse legal das
          fotos enviadas e pelo cumprimento das normas profissionais aplicáveis à corretagem de
          imóveis, incluindo o registro no CRECI quando exigido para publicação do catálogo.
        </p>
        <p>
          Contas podem ser bloqueadas em caso de uso indevido da plataforma, violação destes termos
          ou por solicitação de autoridade competente.
        </p>
        <p>
          Consulte também a nossa{" "}
          <a href="/politica-de-privacidade" className="underline">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </main>
  );
}
