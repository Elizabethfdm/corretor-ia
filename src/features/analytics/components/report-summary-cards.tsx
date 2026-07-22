import { ANALYTICS_EVENT_TYPE_LABELS } from "@/lib/analytics/labels";
import type { ReportSummary } from "@/server/services/analytics-service";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

/** RF-067, RF-069: cartões de indicadores e imóvel mais acessado; RN-088: estado vazio claro. */
export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  if (summary.isEmpty) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Nenhum dado registrado para o período selecionado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          Object.entries(summary.counts) as [keyof typeof ANALYTICS_EVENT_TYPE_LABELS, number][]
        ).map(([eventType, count]) => (
          <div
            key={eventType}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{count}</p>
            <p className="text-xs text-zinc-500">{ANALYTICS_EVENT_TYPE_LABELS[eventType]}</p>
          </div>
        ))}
      </div>

      {summary.mostViewedProperty ? (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Imóvel mais acessado no período</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {summary.mostViewedProperty.title}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {summary.mostViewedProperty.views}{" "}
            {summary.mostViewedProperty.views === 1 ? "visualização" : "visualizações"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
