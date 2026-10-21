/*
  Warnings:

  - You are about to drop the column `eventHallBookingLink` on the `organizations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('APP', 'WALK_IN', 'PHONE', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'COMPLIMENTARY');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'FINAL', 'DEPOSIT_REFUND');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DharamshalaBookingStatus" ADD VALUE 'APPROVED';
ALTER TYPE "DharamshalaBookingStatus" ADD VALUE 'REJECTED';
ALTER TYPE "DharamshalaBookingStatus" ADD VALUE 'WAITING_LIST';
ALTER TYPE "DharamshalaBookingStatus" ADD VALUE 'RESERVED';
ALTER TYPE "DharamshalaBookingStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "dharamshala_bookings" ADD COLUMN     "actualCheckIn" TIMESTAMP(3),
ADD COLUMN     "actualCheckOut" TIMESTAMP(3),
ADD COLUMN     "bookingType" TEXT NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "depositAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'APP',
ADD COLUMN     "vehicleNumber" TEXT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "eventHallBookingLink",
ADD COLUMN     "eventHallImages" JSONB,
ADD COLUMN     "timeline" JSONB;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "contactPersonIds" JSONB,
ADD COLUMN     "participantMonkIds" JSONB;

-- CreateTable
CREATE TABLE "booking_allocations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "roomOrHallId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "mode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "type" "PaymentType" NOT NULL DEFAULT 'FINAL',
    "receiptUrl" TEXT,
    "transactionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dharamshala_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trustName" TEXT,
    "bankDetails" TEXT,
    "upiDetails" TEXT,
    "cancellationPolicy" TEXT,
    "receiptTerms" TEXT,
    "receiptFooter" TEXT,
    "stampUrl" TEXT,
    "signatureUrl" TEXT,
    "authorizedPerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dharamshala_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roomOrHallId" TEXT,
    "ruleType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_halls" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "roomCount" INTEGER NOT NULL DEFAULT 0,
    "foodAvailable" BOOLEAN NOT NULL DEFAULT false,
    "facilities" TEXT,
    "images" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_hall_bookings" (
    "id" TEXT NOT NULL,
    "eventHallId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'SUBMITTED',
    "amountPaid" DECIMAL(12,2),
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_hall_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_allocations_bookingId_idx" ON "booking_allocations"("bookingId");

-- CreateIndex
CREATE INDEX "booking_allocations_roomOrHallId_idx" ON "booking_allocations"("roomOrHallId");

-- CreateIndex
CREATE INDEX "payment_records_bookingId_idx" ON "payment_records"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "dharamshala_settings_organizationId_key" ON "dharamshala_settings"("organizationId");

-- CreateIndex
CREATE INDEX "accommodation_rules_organizationId_idx" ON "accommodation_rules"("organizationId");

-- AddForeignKey
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "dharamshala_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_roomOrHallId_fkey" FOREIGN KEY ("roomOrHallId") REFERENCES "rooms_and_halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "dharamshala_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dharamshala_settings" ADD CONSTRAINT "dharamshala_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodation_rules" ADD CONSTRAINT "accommodation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodation_rules" ADD CONSTRAINT "accommodation_rules_roomOrHallId_fkey" FOREIGN KEY ("roomOrHallId") REFERENCES "rooms_and_halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_halls" ADD CONSTRAINT "event_halls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hall_bookings" ADD CONSTRAINT "event_hall_bookings_eventHallId_fkey" FOREIGN KEY ("eventHallId") REFERENCES "event_halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hall_bookings" ADD CONSTRAINT "event_hall_bookings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
