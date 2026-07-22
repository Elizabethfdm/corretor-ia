import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const REPORT_PERIOD_OPTIONS = ["today", "7d", "30d", "custom"] as const;
export type ReportPeriod = (typeof REPORT_PERIOD_OPTIONS)[number];

/**
 * RF-068: período do relatório vem de `searchParams` — cada campo usa
 * `.catch()` para nunca derrubar a página por um parâmetro de URL
 * malformado (mesmo padrão de `catalog-filters.ts`, RN-047).
 */
export const reportFiltersSchema = z.object({
  period: z.preprocess(emptyToUndefined, z.enum(REPORT_PERIOD_OPTIONS).default("7d")).catch("7d"),
  from: z.preprocess(emptyToUndefined, z.string().regex(DATE_REGEX).optional()).catch(undefined),
  to: z.preprocess(emptyToUndefined, z.string().regex(DATE_REGEX).optional()).catch(undefined),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export function parseReportFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ReportFilters {
  return reportFiltersSchema.parse(searchParams);
}

const PERIOD_DAYS_BACK: Record<Exclude<ReportPeriod, "custom">, number> = {
  today: 0,
  "7d": 6,
  "30d": 29,
};

/**
 * Resolve o período em datas concretas. RF-068: "hoje" e "personalizado"
 * usam o dia local do servidor. Um período "custom" sem `from`/`to`
 * válidos (ou com `from` depois de `to`) nunca gera um relatório
 * quebrado — cai de volta para os últimos 7 dias, mesmo espírito
 * resiliente do `catalogFiltersSchema`.
 */
export function resolveReportDateRange(
  filters: ReportFilters,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filters.period === "custom" && filters.from && filters.to) {
    const from = new Date(`${filters.from}T00:00:00.000`);
    const to = new Date(`${filters.to}T23:59:59.999`);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      return { from, to };
    }
  }

  const daysBack =
    filters.period === "custom" ? PERIOD_DAYS_BACK["7d"] : PERIOD_DAYS_BACK[filters.period];
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, 0, 0, 0, 0);
  return { from, to: endOfToday };
}
