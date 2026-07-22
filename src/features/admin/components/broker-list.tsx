import { blockBrokerAction, unblockBrokerAction } from "@/features/admin/actions";
import type { AdminBrokerRow } from "@/server/services/admin-service";

interface BrokerListProps {
  brokers: AdminBrokerRow[];
}

/** RF-072, RF-073: lista de corretores com contagem de imóveis e bloqueio/desbloqueio. */
export function BrokerList({ brokers }: BrokerListProps) {
  if (brokers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nenhum corretor cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {brokers.map((broker) => (
        <li
          key={broker.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {broker.professionalName}
              {broker.banned ? (
                <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                  Bloqueado
                </span>
              ) : null}
            </p>
            <p className="text-sm text-zinc-500">{broker.email}</p>
            <p className="text-xs text-zinc-500">
              {broker.propertyCount} {broker.propertyCount === 1 ? "imóvel" : "imóveis"}
            </p>
          </div>

          {broker.banned ? (
            <form action={unblockBrokerAction}>
              <input type="hidden" name="userId" value={broker.userId} />
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Desbloquear
              </button>
            </form>
          ) : (
            <form action={blockBrokerAction}>
              <input type="hidden" name="userId" value={broker.userId} />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
              >
                Bloquear
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
