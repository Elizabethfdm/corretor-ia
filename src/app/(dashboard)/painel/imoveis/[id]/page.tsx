import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { getOwnProperty, PropertyNotFoundError } from "@/server/services/property-service";
import { listAdvertisementsForProperty } from "@/server/services/advertisement-service";
import { serializeProperty } from "@/features/properties/serialize-property";
import { PropertyEditor } from "@/features/properties/components/property-editor";

export const metadata: Metadata = {
  title: "Editar imóvel — Corretor IA",
};

interface PropertyEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyEditPage({ params }: PropertyEditPageProps) {
  const { id } = await params;
  const broker = await requireBrokerProfile();

  let property;
  try {
    property = await getOwnProperty(id, broker.id);
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      notFound();
    }
    throw error;
  }

  const serialized = serializeProperty(property);
  const advertisements = await listAdvertisementsForProperty(id, broker.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <Link href="/painel/imoveis" className="text-sm text-zinc-500 underline">
          Meus imóveis
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {serialized.internalTitle}
        </h1>
      </header>

      <PropertyEditor property={serialized} advertisements={advertisements} />
    </div>
  );
}
