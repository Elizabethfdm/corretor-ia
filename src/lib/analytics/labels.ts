import { AnalyticsEventType } from "@/generated/prisma/enums";

/** RF-067: rótulos exibidos no relatório para cada tipo de evento. */
export const ANALYTICS_EVENT_TYPE_LABELS: Record<AnalyticsEventType, string> = {
  [AnalyticsEventType.CATALOG_VIEW]: "Visualizações do catálogo",
  [AnalyticsEventType.PROPERTY_VIEW]: "Visualizações de imóveis",
  [AnalyticsEventType.WHATSAPP_CLICK]: "Cliques no WhatsApp",
  [AnalyticsEventType.SHARE_CLICK]: "Compartilhamentos",
  [AnalyticsEventType.COPY_LINK]: "Links copiados",
  [AnalyticsEventType.AD_GENERATED]: "Anúncios gerados",
  [AnalyticsEventType.ART_GENERATED]: "Artes geradas",
};
