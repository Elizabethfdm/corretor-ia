import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/policies/auth-policy";
import { getOwnProfile } from "@/server/services/broker-profile-service";
import { listOwnProperties } from "@/server/services/property-service";
import { getReportSummary } from "@/server/services/analytics-service";
import { parseReportFilters } from "@/lib/validation/report-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyOverviewCards } from "@/features/dashboard/components/property-overview-cards";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { ReportSummaryCards } from "@/features/analytics/components/report-summary-cards";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Painel — Corretor IA",
};

export default async function PainelPage() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);

  const [properties, reportSummary] = profile
    ? await Promise.all([
        listOwnProperties(profile.id),
        getReportSummary(profile.id, parseReportFilters({})),
      ])
    : [null, null];

  const publishedCount = properties?.filter((p) => p.status === "AVAILABLE").length ?? 0;
  const draftCount = properties?.filter((p) => p.status === "DRAFT").length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Olá, {user.name}</h1>
      </header>

      {profile && properties && reportSummary ? (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  {profile.professionalName}
                </p>
                {profile.catalogEnabled ? (
                  <Link
                    href={`/catalogo/${profile.slug}`}
                    target="_blank"
                    className="text-sm text-neutral-500 underline dark:text-neutral-400"
                  >
                    /catalogo/{profile.slug}
                  </Link>
                ) : null}
              </div>
              <Badge variant={profile.catalogEnabled ? "success" : "neutral"}>
                {profile.catalogEnabled ? "Catálogo publicado" : "Catálogo despublicado"}
              </Badge>
            </CardContent>
          </Card>

          <QuickActions />

          <PropertyOverviewCards
            total={properties.length}
            published={publishedCount}
            drafts={draftCount}
          />

          <Card>
            <CardHeader>
              <CardTitle>Atividade recente (últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportSummaryCards summary={reportSummary} />
              <Link
                href="/painel/relatorios"
                className="text-primary-700 dark:text-primary-300 mt-4 inline-block text-sm underline"
              >
                Ver relatórios completos
              </Link>
            </CardContent>
          </Card>
        </>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Complete seu perfil profissional para poder publicar seu catálogo digital.
          </p>
          <Link
            href="/painel/perfil"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-fit")}
          >
            Completar perfil
          </Link>
        </section>
      )}
    </div>
  );
}
