import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, Bed, BedDouble, Calendar, Car, Pencil, Ruler } from "lucide-react";
import { getPublicProperty } from "@/server/services/catalog-service";
import { recordPropertyView } from "@/server/services/analytics-service";
import { getCurrentSession } from "@/server/policies/auth-policy";
import { formatCurrencyBRL } from "@/lib/money/format-currency";
import { buildPropertyShareText } from "@/lib/sharing/build-share-text";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { PropertyGallery } from "@/features/catalog/components/property-gallery";
import { PropertyContactCard } from "@/features/catalog/components/property-contact-card";
import { SimilarProperties } from "@/features/catalog/components/similar-properties";
import { ShareButtons } from "@/features/catalog/components/share-buttons";

interface PropertyPageProps {
  params: Promise<{ slug: string; propertySlug: string }>;
}

const APP_URL = process.env["APP_URL"] ?? "http://localhost:3000";

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug, propertySlug } = await params;
  const result = await getPublicProperty(slug, propertySlug);

  if (!result) {
    return { title: "Imóvel não encontrado — Corretor IA" };
  }

  return {
    title: `${result.property.title} — ${result.profile.professionalName}`,
    description: result.property.description ?? result.property.title,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug, propertySlug } = await params;
  const result = await getPublicProperty(slug, propertySlug);

  if (!result) {
    notFound();
  }

  const { profile, property, similar } = result;
  await recordPropertyView(profile.id, property.id);
  const propertyUrl = `${APP_URL}/catalogo/${slug}/${propertySlug}`;

  const session = await getCurrentSession();
  const isOwner = session?.user.id === profile.userId;

  const specs = [
    property.bedrooms ? { icon: Bed, label: `${property.bedrooms} quartos` } : null,
    property.suites ? { icon: BedDouble, label: `${property.suites} suítes` } : null,
    property.bathrooms ? { icon: Bath, label: `${property.bathrooms} banheiros` } : null,
    property.parkingSpaces ? { icon: Car, label: `${property.parkingSpaces} vagas` } : null,
    property.totalArea ? { icon: Ruler, label: `${property.totalArea} m² totais` } : null,
    property.builtArea ? { icon: Ruler, label: `${property.builtArea} m² construídos` } : null,
    property.constructionYear
      ? { icon: Calendar, label: `Construído em ${property.constructionYear}` }
      : null,
  ].filter((spec): spec is { icon: typeof Bed; label: string } => spec !== null);

  const conditions = [
    property.furnished ? "Mobiliado" : null,
    property.petFriendly ? "Aceita animais" : null,
    property.financingAccepted ? "Aceita financiamento" : null,
    property.exchangeAccepted ? "Aceita permuta" : null,
  ].filter(Boolean);

  const addressLine = property.address
    ? [
        property.address.street
          ? `${property.address.street}${property.address.number ? `, ${property.address.number}` : ""}`
          : null,
        property.address.complement,
        property.address.neighborhood,
        property.address.city,
      ]
        .filter(Boolean)
        .join(" — ")
    : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 pb-24">
      <Link href={`/catalogo/${slug}`} className="text-sm text-zinc-500 underline">
        Voltar ao catálogo de {profile.professionalName}
      </Link>

      {isOwner ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Você está vendo seu imóvel publicado.
            </p>
            <Link
              href={`/painel/imoveis/${property.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Gerenciar este imóvel
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <PropertyGallery photos={property.photos} title={property.title} />

      <div className="flex flex-col gap-2">
        {property.featured ? (
          <Badge variant="warning" className="w-fit">
            Destaque
          </Badge>
        ) : null}

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{property.title}</h1>

        <p className="text-sm text-zinc-500">
          {property.propertyType} · {property.purpose}
          {property.referenceCode ? ` · Código ${property.referenceCode}` : ""}
        </p>

        <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {property.showPrice
            ? formatCurrencyBRL(property.price) || "Valor não informado"
            : "Consulte o valor"}
        </p>

        {property.condominiumFee ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Condomínio: {formatCurrencyBRL(property.condominiumFee)}
          </p>
        ) : null}
        {property.propertyTax ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            IPTU: {formatCurrencyBRL(property.propertyTax)}
          </p>
        ) : null}

        {specs.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
            {specs.map((spec) => (
              <li
                key={spec.label}
                className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <spec.icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                {spec.label}
              </li>
            ))}
          </ul>
        ) : null}

        {conditions.length > 0 ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{conditions.join(" · ")}</p>
        ) : null}

        {addressLine ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{addressLine}</p>
        ) : null}

        {property.features.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-2">
            {property.features.map((feature) => (
              <li key={feature}>
                <Badge variant="neutral">{feature}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {property.description ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Descrição</h2>
          <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {property.description}
          </p>
        </section>
      ) : null}

      {property.highlights ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Diferenciais</h2>
          <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {property.highlights}
          </p>
        </section>
      ) : null}

      {property.nearbyPlaces ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Proximidades</h2>
          <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {property.nearbyPlaces}
          </p>
        </section>
      ) : null}

      {property.commercialConditions ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Condições comerciais
          </h2>
          <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {property.commercialConditions}
          </p>
        </section>
      ) : null}

      <ShareButtons
        text={buildPropertyShareText({
          title: property.title,
          price: property.price,
          showPrice: property.showPrice,
          city: property.city,
          neighborhood: property.neighborhood,
        })}
        brokerId={profile.id}
        propertyId={property.id}
      />

      <PropertyContactCard profile={profile} property={property} propertyUrl={propertyUrl} />

      <SimilarProperties brokerSlug={slug} properties={similar} />
    </div>
  );
}
