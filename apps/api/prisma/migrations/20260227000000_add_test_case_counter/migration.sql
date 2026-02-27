-- CreateTable
CREATE TABLE IF NOT EXISTS "TestCaseCounter" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TestCaseCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TestCaseCounter_projectId_key" ON "TestCaseCounter"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestCaseCounter_projectId_idx" ON "TestCaseCounter"("projectId");
