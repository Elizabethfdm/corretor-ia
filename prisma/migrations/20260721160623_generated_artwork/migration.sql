-- CreateEnum
CREATE TYPE "ArtworkFormat" AS ENUM ('SQUARE_FEED', 'VERTICAL_FEED', 'STORY', 'WHATSAPP_STATUS', 'REEL_COVER');

-- CreateEnum
CREATE TYPE "ArtworkTemplateType" AS ENUM ('NEW_PROPERTY', 'HIGHLIGHT', 'OPPORTUNITY', 'SALE', 'RENT', 'PRICE_DROP', 'RESERVED', 'SOLD', 'OPEN_HOUSE');

-- CreateTable
CREATE TABLE "generated_artwork" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "photoMediaId" TEXT,
    "format" "ArtworkFormat" NOT NULL,
    "templateType" "ArtworkTemplateType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "callToAction" TEXT NOT NULL,
    "outputKey" TEXT NOT NULL,
    "outputUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_artwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_artwork_brokerId_createdAt_idx" ON "generated_artwork"("brokerId", "createdAt");

-- CreateIndex
CREATE INDEX "generated_artwork_propertyId_createdAt_idx" ON "generated_artwork"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "generated_artwork" ADD CONSTRAINT "generated_artwork_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "broker_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_artwork" ADD CONSTRAINT "generated_artwork_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_artwork" ADD CONSTRAINT "generated_artwork_photoMediaId_fkey" FOREIGN KEY ("photoMediaId") REFERENCES "property_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
