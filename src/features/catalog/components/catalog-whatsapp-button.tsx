"use client";

import { recordWhatsappClickAction } from "@/features/analytics/actions";

interface CatalogWhatsAppButtonProps {
  href: string;
  brokerId: string;
}

/** RN-089: clique de contato geral do catálogo (sem imóvel específico) registrado como `whatsapp_click`. */
export function CatalogWhatsAppButton({ href, brokerId }: CatalogWhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void recordWhatsappClickAction(brokerId, null)}
      className="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-center rounded-md bg-green-700 px-4 py-3 text-center font-medium text-white shadow-lg hover:bg-green-800 sm:static sm:mx-0"
    >
      Falar no WhatsApp
    </a>
  );
}
