import { AdvertisementChannel, AdvertisementStatus, AdvertisementTone } from "@/generated/prisma/enums";
import type { AdvertisementSize } from "@/lib/ai/types";

export const ADVERTISEMENT_CHANNEL_LABELS: Record<AdvertisementChannel, string> = {
  [AdvertisementChannel.INSTAGRAM]: "Instagram",
  [AdvertisementChannel.FACEBOOK]: "Facebook",
  [AdvertisementChannel.WHATSAPP]: "Mensagem de WhatsApp",
  [AdvertisementChannel.STORY]: "Story",
  [AdvertisementChannel.GENERIC]: "Genérico (vários canais)",
};

export const ADVERTISEMENT_TONE_LABELS: Record<AdvertisementTone, string> = {
  [AdvertisementTone.PROFESSIONAL]: "Profissional",
  [AdvertisementTone.ELEGANT]: "Elegante",
  [AdvertisementTone.WELCOMING]: "Acolhedor",
  [AdvertisementTone.OBJECTIVE]: "Objetivo",
  [AdvertisementTone.PERSUASIVE]: "Persuasivo",
  [AdvertisementTone.HIGH_END]: "Alto padrão",
  [AdvertisementTone.INVESTMENT]: "Foco em investimento",
};

export const ADVERTISEMENT_SIZE_LABELS: Record<AdvertisementSize, string> = {
  SHORT: "Curto",
  MEDIUM: "Médio",
  LONG: "Longo",
};

export const ADVERTISEMENT_STATUS_LABELS: Record<AdvertisementStatus, string> = {
  [AdvertisementStatus.GENERATED]: "Gerado",
  [AdvertisementStatus.EDITED]: "Editado pelo corretor",
  [AdvertisementStatus.FAILED]: "Falhou",
};
