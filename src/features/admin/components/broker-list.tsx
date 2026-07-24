import { blockBrokerAction, unblockBrokerAction } from "@/features/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminBrokerRow } from "@/server/services/admin-service";

interface BrokerListProps {
  brokers: AdminBrokerRow[];
}

/** RF-072, RF-073: lista de corretores com contagem de imóveis e bloqueio/desbloqueio. */
export function BrokerList({ brokers }: BrokerListProps) {
  if (brokers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Nenhum corretor cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {brokers.map((broker) => (
        <li key={broker.id}>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-50">
                  {broker.professionalName}
                  {broker.banned ? <Badge variant="danger">Bloqueado</Badge> : null}
                </p>
                <p className="text-sm text-neutral-500">{broker.email}</p>
                <p className="text-xs text-neutral-500">
                  {broker.propertyCount} {broker.propertyCount === 1 ? "imóvel" : "imóveis"}
                </p>
              </div>

              {broker.banned ? (
                <form action={unblockBrokerAction}>
                  <input type="hidden" name="userId" value={broker.userId} />
                  <Button type="submit" variant="outline">
                    Desbloquear
                  </Button>
                </form>
              ) : (
                <form action={blockBrokerAction}>
                  <input type="hidden" name="userId" value={broker.userId} />
                  <Button type="submit" variant="destructive">
                    Bloquear
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
