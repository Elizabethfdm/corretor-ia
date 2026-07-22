import type { Metadata } from "next";
import { requireAdmin } from "@/server/policies/auth-policy";
import {
  getPlatformIndicators,
  listBrokersForAdmin,
  listRecentAuditLog,
} from "@/server/services/admin-service";
import { PlatformIndicatorsCards } from "@/features/admin/components/platform-indicators";
import { BrokerList } from "@/features/admin/components/broker-list";
import { AuditLogList } from "@/features/admin/components/audit-log-list";

export const metadata: Metadata = {
  title: "Administração — Corretor IA",
};

/** RN-095: rota administrativa protegida — validado no servidor via `requireAdmin`. */
export default async function PainelAdminPage() {
  await requireAdmin();

  const [indicators, brokers, auditLog] = await Promise.all([
    getPlatformIndicators(),
    listBrokersForAdmin(),
    listRecentAuditLog(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Administração</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Indicadores gerais
        </h2>
        <PlatformIndicatorsCards indicators={indicators} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Corretores</h2>
        <BrokerList brokers={brokers} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Auditoria recente</h2>
        <AuditLogList entries={auditLog} />
      </section>
    </div>
  );
}
