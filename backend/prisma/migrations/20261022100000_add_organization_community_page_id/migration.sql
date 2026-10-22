ALTER TABLE "organizations"
ADD COLUMN IF NOT EXISTS "communityPageId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_communityPageId_fkey'
  ) THEN
    ALTER TABLE "organizations"
    ADD CONSTRAINT "organizations_communityPageId_fkey"
    FOREIGN KEY ("communityPageId")
    REFERENCES "community_pages"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
