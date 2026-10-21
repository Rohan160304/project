-- Add missing columns to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "linkedMonkIds" JSONB;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "contactPersonIds" JSONB;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "externalLinks" JSONB;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "additionalNotes" TEXT;

-- Add missing columns to ads table
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "pricingModel" TEXT NOT NULL DEFAULT 'CPM';
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "priceRate" DOUBLE PRECISION;
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "totalCost" DOUBLE PRECISION;
