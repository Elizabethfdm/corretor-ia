import type { Metadata } from "next";
import Link from "next/link";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { listDeletedProperties, listOwnProperties } from "@/server/services/property-service";
import { createPropertyAction, restorePropertyAction } from "@/features/properties/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrencyBRL } from "@/lib/money/format-currency";
import { PROPERTY_STATUS_LABELS, PURPOSE_LABELS } from "@/lib/property/labels";

export const metadata: Metadata = {
  title: "Meus imóveis — Corretor IA",
};

export default async function ImoveisPage() {
  const broker = await requireBrokerProfile();
  const [properties, deletedProperties] = await Promise.all([
    listOwnProperties(broker.id),
    listDeletedProperties(broker.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Meus imóveis</h1>
        <form action={createPropertyAction}>
          <SubmitButton pendingLabel="Criando..." className="w-auto px-4 py-2 text-sm">
            Novo imóvel
          </SubmitButton>
        </form>
      </header>

      {properties.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhum imóvel cadastrado ainda. Clique em &quot;Novo imóvel&quot; para começar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {properties.map((property) => {
            const cover = property.media.find((m) => m.isCover) ?? property.media[0];
            return (
              <li key={property.id}>
                <Link
                  href={`/painel/imoveis/${property.id}`}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
                    <img
                      src={cover.publicUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-dashed border-zinc-300 text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      Sem foto
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {property.internalTitle}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {PURPOSE_LABELS[property.purpose]} ·{" "}
                      {property.showPrice
                        ? formatCurrencyBRL(property.price?.toString()) || "Sem valor"
                        : "Consulte o valor"}
                    </span>
                  </div>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {PROPERTY_STATUS_LABELS[property.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {deletedProperties.length > 0 ? (
        <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Excluídos recentemente (RN-028)
          </h2>
          <ul className="flex flex-col gap-2">
            {deletedProperties.map((property) => (
              <li
                key={property.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700"
              >
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {property.internalTitle}
                </span>
                <form action={restorePropertyAction}>
                  <input type="hidden" name="propertyId" value={property.id} />
                  <button type="submit" className="text-sm underline">
                    Restaurar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href="/painel" className="text-sm underline">
        Voltar ao painel
      </Link>
    </div>
  );
}
