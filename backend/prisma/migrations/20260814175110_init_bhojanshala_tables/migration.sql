/*
  Warnings:

  - The `insideTempleType` column on the `organizations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `medicalFormId` on the `tour_participants` table. All the data in the column will be lost.
  - You are about to drop the `event_feedback` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `features` on the `subscription_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BhojanshalaPassStatus" AS ENUM ('BOOKED', 'SCANNED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'CHOUVIHAR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_OUT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoomStatus" ADD VALUE 'OCCUPIED';
ALTER TYPE "RoomStatus" ADD VALUE 'DIRTY';
ALTER TYPE "RoomStatus" ADD VALUE 'UNDER_CLEANING';
ALTER TYPE "RoomStatus" ADD VALUE 'READY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoomType" ADD VALUE 'LOCKER';
ALTER TYPE "RoomType" ADD VALUE 'COTTAGE';
ALTER TYPE "RoomType" ADD VALUE 'SUITE';
ALTER TYPE "RoomType" ADD VALUE 'APARTMENT';

-- DropForeignKey
ALTER TABLE "event_feedback" DROP CONSTRAINT "event_feedback_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_feedback" DROP CONSTRAINT "event_feedback_memberId_fkey";

-- DropForeignKey
ALTER TABLE "tours" DROP CONSTRAINT "tours_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "tours" DROP CONSTRAINT "tours_primaryMonkId_fkey";

-- DropIndex
DROP INDEX "dhaja_records_organizationId_year_key";

-- AlterTable
ALTER TABLE "feed_posts" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "establishedDate" TIMESTAMP(3),
DROP COLUMN "insideTempleType",
ADD COLUMN     "insideTempleType" "TempleType";

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "features",
ADD COLUMN     "features" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "tour_participants" DROP COLUMN "medicalFormId";

-- AlterTable
ALTER TABLE "tours" ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "jatraTarget" DROP NOT NULL,
ALTER COLUMN "primaryMonkId" DROP NOT NULL;

-- DropTable
DROP TABLE "event_feedback";

-- CreateTable
CREATE TABLE "feed_post_views" (
    "id" TEXT NOT NULL,
    "feedPostId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_post_likes" (
    "id" TEXT NOT NULL,
    "feedPostId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_post_reports" (
    "id" TEXT NOT NULL,
    "feedPostId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bhojanshala_passes" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numberOfPersons" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BhojanshalaPassStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bhojanshala_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bhojanshala_pass_scans" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" JSONB,

    CONSTRAINT "bhojanshala_pass_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bhojanshala_menu_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "date" TIMESTAMP(3),
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bhojanshala_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feed_post_views_feedPostId_memberId_key" ON "feed_post_views"("feedPostId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "feed_post_likes_feedPostId_memberId_key" ON "feed_post_likes"("feedPostId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "feed_post_reports_feedPostId_memberId_key" ON "feed_post_reports"("feedPostId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "bhojanshala_passes_publicId_key" ON "bhojanshala_passes"("publicId");

-- CreateIndex
CREATE INDEX "bhojanshala_passes_organizationId_date_idx" ON "bhojanshala_passes"("organizationId", "date");

-- CreateIndex
CREATE INDEX "bhojanshala_passes_memberId_idx" ON "bhojanshala_passes"("memberId");

-- CreateIndex
CREATE INDEX "bhojanshala_menu_items_organizationId_mealType_idx" ON "bhojanshala_menu_items"("organizationId", "mealType");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tour_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_primaryMonkId_fkey" FOREIGN KEY ("primaryMonkId") REFERENCES "monk_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_views" ADD CONSTRAINT "feed_post_views_feedPostId_fkey" FOREIGN KEY ("feedPostId") REFERENCES "feed_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_views" ADD CONSTRAINT "feed_post_views_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_likes" ADD CONSTRAINT "feed_post_likes_feedPostId_fkey" FOREIGN KEY ("feedPostId") REFERENCES "feed_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_likes" ADD CONSTRAINT "feed_post_likes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_reports" ADD CONSTRAINT "feed_post_reports_feedPostId_fkey" FOREIGN KEY ("feedPostId") REFERENCES "feed_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_post_reports" ADD CONSTRAINT "feed_post_reports_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhojanshala_passes" ADD CONSTRAINT "bhojanshala_passes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhojanshala_passes" ADD CONSTRAINT "bhojanshala_passes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhojanshala_pass_scans" ADD CONSTRAINT "bhojanshala_pass_scans_passId_fkey" FOREIGN KEY ("passId") REFERENCES "bhojanshala_passes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhojanshala_pass_scans" ADD CONSTRAINT "bhojanshala_pass_scans_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bhojanshala_menu_items" ADD CONSTRAINT "bhojanshala_menu_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
