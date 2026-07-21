import { REPORT_PERIOD_OPTIONS, type ReportFilters } from "@/lib/validation/report-filters";

interface ReportPeriodFormProps {
  filters: ReportFilters;
}

const PERIOD_LABELS: Record<(typeof REPORT_PERIOD_OPTIONS)[number], string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  custom: "Período personalizado",
};

const INPUT_CLASS =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

/**
 * RF-068: filtro por período — formulário GET simples (sem
 * JavaScript), mesmo padrão de `CatalogFiltersForm` (RN-047):
 * navegação com filtro refletido na própria URL.
 */
export function ReportPeriodForm({ filters }: ReportPeriodFormProps) {
  return (
    <form action="/painel/relatorios" method="GET" className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="period" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
          Período
        </label>
        <select id="period" name="period" defaultValue={filters.period} className={INPUT_CLASS}>
          {REPORT_PERIOD_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {PERIOD_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="from" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
          De
        </label>
        <input id="from" name="from" type="date" defaultValue={filters.from ?? ""} className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="to" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
          Até
        </label>
        <input id="to" name="to" type="date" defaultValue={filters.to ?? ""} className={INPUT_CLASS} />
      </div>

      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Aplicar
      </button>
    </form>
  );
}
