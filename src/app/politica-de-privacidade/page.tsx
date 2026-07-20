import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Corretor IA",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Política de Privacidade
      </h1>
      <p className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Este documento é um modelo inicial e ainda não passou por revisão jurídica. Não deve ser
        considerado definitivo para operação comercial.
      </p>
      <div className="flex flex-col gap-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>
          Coletamos apenas os dados necessários para o funcionamento da plataforma: dados de conta
          (nome, e-mail e senha com hash seguro), dados de perfil profissional, dados dos imóveis
          cadastrados e eventos agregados de acesso ao seu catálogo (sem identificação pessoal de
          visitantes).
        </p>
        <p>
          Não armazenamos o conteúdo de conversas do WhatsApp e não coletamos dados financeiros do
          cliente final interessado em um imóvel.
        </p>
        <p>
          O endereço completo de um imóvel só é exibido publicamente se você optar explicitamente
          por isso; por padrão, apenas bairro e cidade ficam visíveis no catálogo.
        </p>
        <p>
          Você pode solicitar a exclusão da sua conta a qualquer momento. Alguns registros podem ser
          mantidos por período limitado para fins de auditoria e segurança, conforme a legislação
          aplicável.
        </p>
        <p>
          Consulte também os nossos{" "}
          <a href="/termos-de-uso" className="underline">
            Termos de Uso
          </a>
          .
        </p>
      </div>
    </main>
  );
}
