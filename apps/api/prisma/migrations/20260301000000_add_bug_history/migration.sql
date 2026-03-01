-- CreateTable BugHistory
CREATE TABLE "BugHistory" (
    "id" SERIAL NOT NULL,
    "bugId" INTEGER NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugHistory_bugId_idx" ON "BugHistory"("bugId");

-- CreateIndex
CREATE INDEX "BugHistory_changedBy_idx" ON "BugHistory"("changedBy");

-- CreateIndex
CREATE INDEX "BugHistory_createdAt_idx" ON "BugHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "BugHistory" ADD CONSTRAINT "BugHistory_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugHistory" ADD CONSTRAINT "BugHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
