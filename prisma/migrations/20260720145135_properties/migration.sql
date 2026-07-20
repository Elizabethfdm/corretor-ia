-- CreateEnum
CREATE TYPE "PropertyPurpose" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'LAND', 'FARM_SMALL', 'FARM', 'RANCH', 'COMMERCIAL_ROOM', 'COMMERCIAL_PROPERTY', 'WAREHOUSE', 'PENTHOUSE', 'TOWNHOUSE', 'STUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AddressVisibility" AS ENUM ('HIDDEN_EXACT', 'FULL_ADDRESS');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('POOL', 'BARBECUE', 'GOURMET_AREA', 'BALCONY', 'GARDEN', 'BACKYARD', 'ELEVATOR', 'GYM', 'PARTY_ROOM', 'CONCIERGE', 'GATED_COMMUNITY', 'AIR_CONDITIONING', 'SOLAR_ENERGY', 'ACCESSIBILITY', 'SEA_VIEW', 'STREET_FRONT', 'SERVICE_AREA');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO');

-- CreateTable
CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "internalTitle" TEXT NOT NULL,
    "publicTitle" TEXT,
    "referenceCode" TEXT,
    "purpose" "PropertyPurpose" NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "price" DECIMAL(12,2),
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "condominiumFee" DECIMAL(12,2),
    "propertyTax" DECIMAL(12,2),
    "bedrooms" INTEGER,
    "suites" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpaces" INTEGER,
    "totalArea" DECIMAL(10,2),
    "builtArea" DECIMAL(10,2),
    "constructionYear" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "financingAccepted" BOOLEAN NOT NULL DEFAULT false,
    "exchangeAccepted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "highlights" TEXT,
    "nearbyPlaces" TEXT,
    "commercialConditions" TEXT,
    "internalNotes" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "slug" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_address" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "zipCode" TEXT,
    "state" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "referencePoint" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "visibilityType" "AddressVisibility" NOT NULL DEFAULT 'HIDDEN_EXACT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_feature" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "featureType" "FeatureType" NOT NULL,

    CONSTRAINT "property_feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'PHOTO',
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_brokerId_status_idx" ON "property"("brokerId", "status");

-- CreateIndex
CREATE INDEX "property_status_publishedAt_idx" ON "property"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "property_brokerId_slug_key" ON "property"("brokerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "property_brokerId_referenceCode_key" ON "property"("brokerId", "referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "property_address_propertyId_key" ON "property_address"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "property_feature_propertyId_featureType_key" ON "property_feature"("propertyId", "featureType");

-- CreateIndex
CREATE INDEX "property_media_propertyId_displayOrder_idx" ON "property_media"("propertyId", "displayOrder");

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "broker_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_address" ADD CONSTRAINT "property_address_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_feature" ADD CONSTRAINT "property_feature_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
