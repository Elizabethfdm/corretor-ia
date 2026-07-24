import { Card, CardContent } from "@/components/ui/card";
import type { AdminAuditLogRow } from "@/server/services/admin-service";

interface AuditLogListProps {
  entries: AdminAuditLogRow[];
}

/** RF-074: eventos básicos de auditoria, mais recentes primeiro. */
export function AuditLogList({ entries }: AuditLogListProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Nenhum evento de auditoria registrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Card>
            <CardContent className="flex flex-col gap-1 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {entry.action}
                </span>
                <span className="text-xs text-neutral-500">
                  {entry.createdAt.toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {entry.entityType} · {entry.entityId}
                {entry.userEmail ? ` · ${entry.userEmail}` : ""}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
