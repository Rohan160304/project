-- CreateEnum
CREATE TYPE "DharamshalaBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PathshalaBookingStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "BhojanshalaPassStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "RoleKey" ADD VALUE 'BHOJANSHALA_ADMIN';

-- AlterEnum
ALTER TYPE "RsvpStatus" ADD VALUE 'CHECKED_IN';

-- DropForeignKey
ALTER TABLE "journeys" DROP CONSTRAINT "journeys_monkId_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_monkId_fkey";

-- AlterTable
ALTER TABLE "journeys" ADD COLUMN     "monkGroupId" TEXT,
ALTER COLUMN "monkId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organization_reviews" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "activeModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bhojanshalaName" TEXT,
ADD COLUMN     "bhojanshalaPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dharamshalaPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasDharamshala" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPathshala" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentOrganizationId" TEXT,
ADD COLUMN     "pathshalaPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "monkGroupId" TEXT,
ALTER COLUMN "monkId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "dharamshala_bookings" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "numberOfRooms" INTEGER NOT NULL DEFAULT 1,
    "numberOfPersons" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "DharamshalaBookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dharamshala_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathshala_bookings" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numberOfPersons" INTEGER NOT NULL DEFAULT 1,
    "status" "PathshalaBookingStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pathshala_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dharamshala_bookings_publicId_key" ON "dharamshala_bookings"("publicId");

-- CreateIndex
CREATE INDEX "dharamshala_bookings_organizationId_fromDate_idx" ON "dharamshala_bookings"("organizationId", "fromDate");

-- CreateIndex
CREATE INDEX "dharamshala_bookings_memberId_idx" ON "dharamshala_bookings"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "pathshala_bookings_publicId_key" ON "pathshala_bookings"("publicId");

-- CreateIndex
CREATE INDEX "pathshala_bookings_organizationId_date_idx" ON "pathshala_bookings"("organizationId", "date");

-- CreateIndex
CREATE INDEX "pathshala_bookings_memberId_idx" ON "pathshala_bookings"("memberId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_monkId_fkey" FOREIGN KEY ("monkId") REFERENCES "monk_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_monkGroupId_fkey" FOREIGN KEY ("monkGroupId") REFERENCES "monk_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_monkId_fkey" FOREIGN KEY ("monkId") REFERENCES "monk_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_monkGroupId_fkey" FOREIGN KEY ("monkGroupId") REFERENCES "monk_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dharamshala_bookings" ADD CONSTRAINT "dharamshala_bookings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dharamshala_bookings" ADD CONSTRAINT "dharamshala_bookings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathshala_bookings" ADD CONSTRAINT "pathshala_bookings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathshala_bookings" ADD CONSTRAINT "pathshala_bookings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
