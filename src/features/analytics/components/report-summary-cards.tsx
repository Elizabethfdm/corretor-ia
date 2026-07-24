import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANALYTICS_EVENT_TYPE_LABELS } from "@/lib/analytics/labels";
import type { ReportSummary } from "@/server/services/analytics-service";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

/** RF-067, RF-069: cartões de indicadores, gráfico simples e imóvel mais acessado; RN-088: estado vazio claro. */
export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  if (summary.isEmpty) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Nenhum dado registrado para o período selecionado.
      </p>
    );
  }

  const counts = Object.entries(summary.counts) as [
    keyof typeof ANALYTICS_EVENT_TYPE_LABELS,
    number,
  ][];
  const maxCount = Math.max(...counts.map(([, count]) => count), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(([eventType, count]) => (
          <Card key={eventType}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {count}
              </p>
              <p className="text-xs text-neutral-500">{ANALYTICS_EVENT_TYPE_LABELS[eventType]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão geral do período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {counts.map(([eventType, count]) => (
            <div key={eventType} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>{ANALYTICS_EVENT_TYPE_LABELS[eventType]}</span>
                <span>{count}</span>
              </div>
              <div
                role="img"
                aria-label={`${ANALYTICS_EVENT_TYPE_LABELS[eventType]}: ${count}`}
                className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
              >
                <div
                  className="bg-primary-500 h-full rounded-full"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {summary.mostViewedProperty ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-neutral-500">Imóvel mais acessado no período</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              {summary.mostViewedProperty.title}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {summary.mostViewedProperty.views}{" "}
              {summary.mostViewedProperty.views === 1 ? "visualização" : "visualizações"}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
