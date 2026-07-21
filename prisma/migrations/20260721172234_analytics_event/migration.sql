-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('CATALOG_VIEW', 'PROPERTY_VIEW', 'WHATSAPP_CLICK', 'SHARE_CLICK', 'COPY_LINK', 'AD_GENERATED', 'ART_GENERATED');

-- CreateEnum
CREATE TYPE "UserAgentCategory" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN');

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "eventType" "AnalyticsEventType" NOT NULL,
    "sessionHash" TEXT,
    "referrer" TEXT,
    "userAgentCategory" "UserAgentCategory" NOT NULL DEFAULT 'UNKNOWN',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_event_brokerId_eventType_occurredAt_idx" ON "analytics_event"("brokerId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_event_brokerId_propertyId_eventType_occurredAt_idx" ON "analytics_event"("brokerId", "propertyId", "eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "broker_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
