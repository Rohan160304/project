/*
  Warnings:

  - You are about to drop the column `date` on the `bhojanshala_menu_items` table. All the data in the column will be lost.
  - Added the required column `dayOfWeek` to the `bhojanshala_menu_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "bhojanshala_menu_items_organizationId_mealType_idx";

-- AlterTable
ALTER TABLE "bhojanshala_menu_items" DROP COLUMN "date",
ADD COLUMN     "dayOfWeek" TEXT NOT NULL,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;

-- CreateIndex
CREATE INDEX "bhojanshala_menu_items_organizationId_mealType_dayOfWeek_idx" ON "bhojanshala_menu_items"("organizationId", "mealType", "dayOfWeek");
