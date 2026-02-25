-- AlterTable TestExecution - Add suiteRunId field
ALTER TABLE "TestExecution" ADD COLUMN "suiteRunId" INTEGER;

-- CreateIndex
CREATE INDEX "TestExecution_suiteRunId_idx" ON "TestExecution"("suiteRunId");

-- AlterTable TestSuiteRun - Add missing fields
ALTER TABLE "TestSuiteRun" ADD COLUMN "testRunId" INTEGER;
ALTER TABLE "TestSuiteRun" ADD COLUMN "description" TEXT;
ALTER TABLE "TestSuiteRun" ADD COLUMN "executedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TestSuiteRun" ADD COLUMN "blockedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TestSuiteRun" ADD COLUMN "skippedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TestSuiteRun" ADD COLUMN "stopOnFailure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TestSuiteRun" ADD COLUMN "executeChildSuites" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TestSuiteRun" ADD COLUMN "executedBy" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "TestSuiteRun" ADD COLUMN "actualStartDate" TIMESTAMP(3);
ALTER TABLE "TestSuiteRun" ADD COLUMN "actualEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TestSuiteRun_testRunId_idx" ON "TestSuiteRun"("testRunId");
CREATE INDEX "TestSuiteRun_executedBy_idx" ON "TestSuiteRun"("executedBy");
CREATE INDEX "TestSuiteRun_status_idx" ON "TestSuiteRun"("status");

-- AddForeignKey
ALTER TABLE "TestExecution" ADD CONSTRAINT "TestExecution_suiteRunId_fkey" FOREIGN KEY ("suiteRunId") REFERENCES "TestSuiteRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSuiteRun" ADD CONSTRAINT "TestSuiteRun_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSuiteRun" ADD CONSTRAINT "TestSuiteRun_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
