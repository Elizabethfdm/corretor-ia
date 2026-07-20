-- CreateTable
CREATE TABLE "broker_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "logoUrl" TEXT,
    "creciNumber" TEXT,
    "creciState" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "commercialEmail" TEXT,
    "biography" TEXT,
    "city" TEXT,
    "state" TEXT,
    "businessAddress" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "slug" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "catalogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broker_profile_userId_key" ON "broker_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "broker_profile_slug_key" ON "broker_profile"("slug");
