/*
  Warnings:

  - You are about to drop the column `favouriteOrganizationId` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "favouriteOrganizationId",
ADD COLUMN     "favouriteBhojanshalaId" TEXT,
ADD COLUMN     "favouriteDharamshalaId" TEXT,
ADD COLUMN     "favouriteTempleId" TEXT;
