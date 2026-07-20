import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/server/services/broker-profile-service";
import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    return { title: "Catálogo não encontrado — Corretor IA" };
  }

  return {
    title: `${profile.professionalName} — Corretor IA`,
    description: profile.biography ?? `Catálogo de imóveis de ${profile.professionalName}.`,
  };
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 pb-24">
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

      <section className="rounded-lg border border-zinc-200 p-6 text-center text-zinc-500 dark:border-zinc-800">
        Nenhum imóvel publicado ainda.
      </section>

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center font-medium text-white shadow-lg hover:bg-green-800 sm:static sm:mx-0"
        >
          Falar no WhatsApp
        </a>
      ) : null}
    </div>
  );
}
