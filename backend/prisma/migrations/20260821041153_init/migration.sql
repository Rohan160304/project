-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrganizationType" ADD VALUE 'GAUSHALA';
ALTER TYPE "OrganizationType" ADD VALUE 'PATHSHALA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleKey" ADD VALUE 'ORG_ADMIN';
ALTER TYPE "RoleKey" ADD VALUE 'GAUSHALA_ADMIN';
ALTER TYPE "RoleKey" ADD VALUE 'PATHSHALA_ADMIN';
