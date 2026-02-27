-- Add missing fields to TestCaseTemplate
ALTER TABLE "TestCaseTemplate" ADD COLUMN "category" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdBy" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "moduleArea" TEXT;

-- Make projectId required
ALTER TABLE "TestCaseTemplate" ALTER COLUMN "projectId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "TestCaseTemplate" ADD CONSTRAINT "TestCaseTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE;
ALTER TABLE "TestCaseTemplate" ADD CONSTRAINT "TestCaseTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT;

-- Add indexes
CREATE INDEX "TestCaseTemplate_createdBy_idx" ON "TestCaseTemplate"("createdBy");
CREATE INDEX "TestCaseTemplate_isActive_idx" ON "TestCaseTemplate"("isActive");

-- Create TestCaseTemplateStep table
CREATE TABLE "TestCaseTemplateStep" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expectedResult" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCaseTemplateStep_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for TestCaseTemplateStep
ALTER TABLE "TestCaseTemplateStep" ADD CONSTRAINT "TestCaseTemplateStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TestCaseTemplate"("id") ON DELETE CASCADE;

-- Add index
CREATE INDEX "TestCaseTemplateStep_templateId_idx" ON "TestCaseTemplateStep"("templateId");
