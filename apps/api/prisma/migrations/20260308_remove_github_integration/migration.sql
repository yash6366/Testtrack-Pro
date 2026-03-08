-- Remove deprecated bug fields
ALTER TABLE "Bug" DROP COLUMN IF EXISTS "codeReviewUrl";
ALTER TABLE "Bug" DROP COLUMN IF EXISTS "fixBranchName";
ALTER TABLE "Bug" DROP COLUMN IF EXISTS "fixedInCommitHash";

-- Remove OAuthIntegration model and relation
DROP TABLE IF EXISTS "OAuthIntegration";
-- Remove relation from User if exists (handled by Prisma migration engine)
