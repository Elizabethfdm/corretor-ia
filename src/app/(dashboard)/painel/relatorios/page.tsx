import type { Metadata } from "next";
import Link from "next/link";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { getReportSummary } from "@/server/services/analytics-service";
import { parseReportFilters } from "@/lib/validation/report-filters";
import { ReportPeriodForm } from "@/features/analytics/components/report-period-form";
import { ReportSummaryCards } from "@/features/analytics/components/report-summary-cards";

export const metadata: Metadata = {
  title: "Relatórios — Corretor IA",
};

interface RelatoriosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const broker = await requireBrokerProfile();
  const filters = parseReportFilters(await searchParams);
  const summary = await getReportSummary(broker.id, filters);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <Link href="/painel" className="text-sm text-zinc-500 underline">
          Painel
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Relatórios</h1>
      </header>

      <ReportPeriodForm filters={filters} />
      <ReportSummaryCards summary={summary} />
    </div>
  );
}
