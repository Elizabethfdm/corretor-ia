-- CreateEnum
CREATE TYPE "AdvertisementChannel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'STORY', 'GENERIC');

-- CreateEnum
CREATE TYPE "AdvertisementTone" AS ENUM ('PROFESSIONAL', 'ELEGANT', 'WELCOMING', 'OBJECTIVE', 'PERSUASIVE', 'HIGH_END', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('GENERATED', 'EDITED', 'FAILED');

-- CreateEnum
CREATE TYPE "AdvertisementSize" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateTable
CREATE TABLE "generated_advertisement" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "channel" "AdvertisementChannel" NOT NULL,
    "tone" "AdvertisementTone" NOT NULL,
    "size" "AdvertisementSize" NOT NULL,
    "objective" TEXT NOT NULL,
    "targetAudience" TEXT,
    "highlightAspects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "callToAction" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AdvertisementStatus" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_advertisement_brokerId_createdAt_idx" ON "generated_advertisement"("brokerId", "createdAt");

-- CreateIndex
CREATE INDEX "generated_advertisement_propertyId_createdAt_idx" ON "generated_advertisement"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "generated_advertisement" ADD CONSTRAINT "generated_advertisement_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "broker_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_advertisement" ADD CONSTRAINT "generated_advertisement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
