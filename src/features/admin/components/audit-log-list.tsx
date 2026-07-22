import type { AdminAuditLogRow } from "@/server/services/admin-service";

interface AuditLogListProps {
  entries: AdminAuditLogRow[];
}

/** RF-074: eventos básicos de auditoria, mais recentes primeiro. */
export function AuditLogList({ entries }: AuditLogListProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nenhum evento de auditoria registrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{entry.action}</span>
            <span className="text-xs text-zinc-500">{entry.createdAt.toLocaleString("pt-BR")}</span>
          </div>
          <p className="text-xs text-zinc-500">
            {entry.entityType} · {entry.entityId}
            {entry.userEmail ? ` · ${entry.userEmail}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
