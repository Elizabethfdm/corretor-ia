import { Building2, CheckCircle2, FileEdit } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface PropertyOverviewCardsProps {
  total: number;
  published: number;
  drafts: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{value}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Indicadores rápidos do acervo de imóveis do corretor (RN-026: já isolado por corretor pela query de origem). */
export function PropertyOverviewCards({ total, published, drafts }: PropertyOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard label="Imóveis cadastrados" value={total} icon={Building2} />
      <StatCard label="Publicados no catálogo" value={published} icon={CheckCircle2} />
      <StatCard label="Rascunhos" value={drafts} icon={FileEdit} />
    </div>
  );
}
