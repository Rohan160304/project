ALTER TABLE "monk_profiles"
ADD COLUMN IF NOT EXISTS "nirvanaTempleId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monk_profiles_nirvanaTempleId_fkey'
  ) THEN
    ALTER TABLE "monk_profiles"
    ADD CONSTRAINT "monk_profiles_nirvanaTempleId_fkey"
    FOREIGN KEY ("nirvanaTempleId")
    REFERENCES "organizations"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
