"use client";

import { useState } from "react";
import { buildWhatsAppShareLink } from "@/lib/whatsapp/build-link";
import { recordCopyLinkAction, recordShareClickAction } from "@/features/analytics/actions";

interface ShareButtonsProps {
  text: string;
  brokerId: string;
  propertyId: string | null;
}

type CopyFeedback = "idle" | "link" | "message";

/**
 * RF-050 a RF-053: compartilhar imóvel, catálogo ou resultado filtrado
 * pelo WhatsApp, copiar link, copiar mensagem e compartilhamento nativo
 * do dispositivo quando suportado (RN-059, RN-060). A URL é lida de
 * `window.location.href` no momento do clique (nunca durante a
 * renderização) — sempre reflete a página/filtro atual, sem precisar
 * ser passada por prop.
 *
 * O botão "Compartilhar…" é sempre renderizado (em vez de detectar
 * suporte a `navigator.share` durante a renderização, o que divergiria
 * entre servidor e cliente e causaria um mismatch de hidratação): seu
 * clique usa a API nativa quando disponível e cai para copiar o link
 * quando não — nunca fica sem efeito.
 *
 * RN-058: nunca afirma que a mensagem foi enviada — o envio efetivo
 * acontece dentro do WhatsApp, fora do controle desta aplicação.
 *
 * RN-057: clique registrado como evento agregado (`share_click`/
 * `copy_link`, Fase 9) — nunca bloqueia a ação do visitante se a
 * gravação falhar.
 */
export function ShareButtons({ text, brokerId, propertyId }: ShareButtonsProps) {
  const [feedback, setFeedback] = useState<CopyFeedback>("idle");

  function handleWhatsAppShare() {
    const href = buildWhatsAppShareLink(`${text}\n${window.location.href}`);
    window.open(href, "_blank", "noopener,noreferrer");
    void recordShareClickAction(brokerId, propertyId);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setFeedback("link");
    window.setTimeout(() => setFeedback("idle"), 3000);
    void recordCopyLinkAction(brokerId, propertyId);
  }

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    setFeedback("message");
    window.setTimeout(() => setFeedback("idle"), 3000);
    void recordShareClickAction(brokerId, propertyId);
  }

  async function handleNativeShare() {
    if ("share" in navigator) {
      await navigator.share({ title: text, url: window.location.href });
      void recordShareClickAction(brokerId, propertyId);
      return;
    }
    await handleCopyLink();
  }

  const buttonClass =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={handleWhatsAppShare} className={buttonClass}>
        Compartilhar no WhatsApp
      </button>

      <button type="button" onClick={handleCopyLink} className={buttonClass}>
        {feedback === "link" ? "Link copiado!" : "Copiar link"}
      </button>

      <button type="button" onClick={handleCopyMessage} className={buttonClass}>
        {feedback === "message" ? "Mensagem copiada!" : "Copiar mensagem"}
      </button>

      <button type="button" onClick={handleNativeShare} className={buttonClass}>
        Compartilhar…
      </button>
    </div>
  );
}
