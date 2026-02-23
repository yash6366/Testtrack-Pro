-- Add missing fields to TestCase model
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "testCaseId" TEXT;
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "postconditions" TEXT;
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "automationStatus" TEXT DEFAULT 'MANUAL';
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "automationScriptLink" TEXT;

-- Add unique constraint for testCaseId
CREATE UNIQUE INDEX IF NOT EXISTS "TestCase_testCaseId_key" ON "TestCase"("testCaseId");

-- Add testData field to TestCaseStep model
ALTER TABLE "TestCaseStep" ADD COLUMN IF NOT EXISTS "testData" TEXT;

-- Update Bug model default status from OPEN to NEW
ALTER TABLE "Bug" ALTER COLUMN "status" SET DEFAULT 'NEW';
