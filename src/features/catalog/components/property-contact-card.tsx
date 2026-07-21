"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp/build-link";
import { recordWhatsappClickAction } from "@/features/analytics/actions";
import type { BrokerProfile } from "@/generated/prisma/client";
import type { PublicPropertyDetail } from "@/server/services/catalog-service";

interface PropertyContactCardProps {
  profile: BrokerProfile;
  property: PublicPropertyDetail;
  propertyUrl: string;
}

/**
 * RN-051: mensagem padrão inclui nome do corretor, título do imóvel,
 * código de referência (quando houver) e URL do imóvel — nunca afirma
 * que a mensagem foi enviada (RN-058), já que o envio real acontece
 * dentro do WhatsApp. RN-052: botão fixo no rodapé no layout mobile.
 * RN-089: clique registrado como `whatsapp_click`.
 */
export function PropertyContactCard({ profile, property, propertyUrl }: PropertyContactCardProps) {
  if (!profile.whatsapp) {
    return null;
  }

  const referenceLine = property.referenceCode ? ` (código ${property.referenceCode})` : "";
  const message = `Olá, ${profile.professionalName}! Tenho interesse no imóvel "${property.title}"${referenceLine}. ${propertyUrl}`;
  const whatsappLink = buildWhatsAppLink(profile.whatsapp, message);

  function handleWhatsAppClick() {
    void recordWhatsappClickAction(profile.id, property.id);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem já hospedada/otimizada pelo storage próprio
          <img
            src={profile.photoUrl}
            alt={profile.professionalName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : null}
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{profile.professionalName}</p>
          {profile.creciNumber ? (
            <p className="text-sm text-zinc-500">
              CRECI {profile.creciNumber}
              {profile.creciState ? `/${profile.creciState}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        className="hidden items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center font-medium text-white hover:bg-green-800 sm:flex"
      >
        Falar no WhatsApp
      </a>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        className="fixed inset-x-4 bottom-4 z-10 flex items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center font-medium text-white shadow-lg hover:bg-green-800 sm:hidden"
      >
        Falar no WhatsApp
      </a>
    </section>
  );
}
