import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

/**
 * RF-068: filtro por período — formulário GET simples (sem
 * JavaScript), mesmo padrão de `CatalogFiltersForm` (RN-047):
 * navegação com filtro refletido na própria URL.
 */
export function ReportPeriodForm({ filters }: ReportPeriodFormProps) {
  return (
    <form action="/painel/relatorios" method="GET" className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor="period"
          className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400"
        >
          Período
        </label>
        <Select id="period" name="period" defaultValue={filters.period}>
          {REPORT_PERIOD_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {PERIOD_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="from" className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          De
        </label>
        <Input id="from" name="from" type="date" defaultValue={filters.from ?? ""} />
      </div>

      <div>
        <label htmlFor="to" className="mb-1 block text-xs text-neutral-600 dark:text-neutral-400">
          Até
        </label>
        <Input id="to" name="to" type="date" defaultValue={filters.to ?? ""} />
      </div>

      <Button type="submit">Aplicar</Button>
    </form>
  );
}
