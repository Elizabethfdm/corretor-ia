import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/policies/auth-policy";
import { getOwnProfile } from "@/server/services/broker-profile-service";
import { ProfileForm } from "@/features/brokers/components/profile-form";
import { ImageUploadForm } from "@/features/brokers/components/image-upload-form";
import { CatalogToggle } from "@/features/brokers/components/catalog-toggle";
import { uploadLogoAction, uploadPhotoAction } from "@/features/brokers/actions";

export const metadata: Metadata = {
  title: "Meu perfil — Corretor IA",
};

export default async function PerfilPage() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Meu perfil</h1>
        <Link href="/painel" className="text-sm underline">
          Voltar ao painel
        </Link>
      </header>

      {profile ? (
        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <CatalogToggle enabled={profile.catalogEnabled} />
          {profile.catalogEnabled ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Catálogo público:{" "}
              <Link href={`/catalogo/${profile.slug}`} className="underline" target="_blank">
                /catalogo/{profile.slug}
              </Link>
            </p>
          ) : null}
        </section>
      ) : (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Complete seu perfil abaixo para poder publicar seu catálogo.
        </p>
      )}

      <ProfileForm profile={profile} />

      {profile ? (
        <div className="flex flex-wrap gap-8">
          <ImageUploadForm
            label="Foto de perfil"
            action={uploadPhotoAction}
            currentUrl={profile.photoUrl}
          />
          <ImageUploadForm
            label="Logotipo"
            action={uploadLogoAction}
            currentUrl={profile.logoUrl}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Salve as informações acima para poder enviar foto de perfil e logotipo.
        </p>
      )}
    </div>
  );
}
