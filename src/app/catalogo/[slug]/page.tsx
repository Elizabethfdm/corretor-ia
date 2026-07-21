import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/server/services/broker-profile-service";
import { getPublicCatalog } from "@/server/services/catalog-service";
import { recordCatalogView } from "@/server/services/analytics-service";
import { parseCatalogFilters } from "@/lib/validation/catalog-filters";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { CatalogFiltersForm } from "@/features/catalog/components/catalog-filters-form";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { CatalogPagination } from "@/features/catalog/components/catalog-pagination";
import { ShareButtons } from "@/features/catalog/components/share-buttons";
import { CatalogWhatsAppButton } from "@/features/catalog/components/catalog-whatsapp-button";
import { buildCatalogShareText } from "@/lib/sharing/build-share-text";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: CatalogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    return { title: "Catálogo não encontrado — Corretor IA" };
  }

  const filters = parseCatalogFilters(await searchParams);
  const hasFilters = Boolean(filters.q || filters.city || filters.neighborhood || filters.type);

  return {
    title: `${profile.professionalName} — Corretor IA`,
    description: hasFilters
      ? `Imóveis de ${profile.professionalName}${filters.city ? ` em ${filters.city}` : ""}.`
      : (profile.biography ?? `Catálogo de imóveis de ${profile.professionalName}.`),
  };
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { slug } = await params;
  const filters = parseCatalogFilters(await searchParams);
  const catalog = await getPublicCatalog(slug, filters);

  if (!catalog) {
    notFound();
  }

  const { profile } = catalog;
  await recordCatalogView(profile.id);
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.purpose ||
      filters.type ||
      filters.city ||
      filters.neighborhood ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      filters.bedroomsMin !== undefined ||
      filters.parkingMin !== undefined ||
      filters.financingAccepted ||
      (filters.features && filters.features.length > 0),
  );

  const whatsappLink = profile.whatsapp
    ? buildWhatsAppLink(
        profile.whatsapp,
        `Olá, ${profile.professionalName}! Vi seu catálogo no Corretor IA e gostaria de mais informações.`,
      )
    : null;

  const socialLinks = [
    { label: "Instagram", href: profile.instagramUrl },
    { label: "Facebook", href: profile.facebookUrl },
    { label: "LinkedIn", href: profile.linkedinUrl },
    { label: "Site", href: profile.websiteUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 pb-24">
      <header className="flex flex-col items-center gap-3 text-center">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
          <img
            src={profile.photoUrl}
            alt={profile.professionalName}
            className="h-28 w-28 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
          />
        ) : null}
        {profile.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
          <img src={profile.logoUrl} alt="" className="h-12 object-contain" />
        ) : null}
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {profile.professionalName}
        </h1>
        {profile.creciNumber ? (
          <p className="text-sm text-zinc-500">
            CRECI {profile.creciNumber}
            {profile.creciState ? `/${profile.creciState}` : ""}
          </p>
        ) : null}
        {profile.city ? (
          <p className="text-sm text-zinc-500">
            {profile.city}
            {profile.state ? ` — ${profile.state}` : ""}
          </p>
        ) : null}
      </header>

      {profile.biography ? (
        <p className="text-center text-zinc-700 dark:text-zinc-300">{profile.biography}</p>
      ) : null}

      {socialLinks.length > 0 ? (
        <nav className="flex flex-wrap justify-center gap-4 text-sm">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <CatalogFiltersForm slug={slug} filters={filters} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500" role="status" aria-live="polite">
          {catalog.total} {catalog.total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </p>
        {/* RN-059: mesma URL atual serve tanto para o catálogo completo quanto para um resultado filtrado. */}
        <ShareButtons
          text={buildCatalogShareText(profile.professionalName)}
          brokerId={profile.id}
          propertyId={null}
        />
      </div>

      <CatalogGrid
        properties={catalog.properties}
        hasActiveFilters={hasActiveFilters}
        brokerSlug={slug}
      />

      <CatalogPagination
        slug={slug}
        filters={filters}
        page={catalog.page}
        totalPages={catalog.totalPages}
      />

      {whatsappLink ? <CatalogWhatsAppButton href={whatsappLink} brokerId={profile.id} /> : null}
    </div>
  );
}
