/*
  Warnings:

  - You are about to drop the column `comment` on the `BugComment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TestSuiteRun` table. All the data in the column will be lost.
  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GitIntegration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Webhook` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookDelivery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_projectId_fkey";

-- DropForeignKey
ALTER TABLE "GitIntegration" DROP CONSTRAINT "GitIntegration_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Webhook" DROP CONSTRAINT "Webhook_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Webhook" DROP CONSTRAINT "Webhook_projectId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookDelivery" DROP CONSTRAINT "WebhookDelivery_webhookId_fkey";

-- AlterTable
ALTER TABLE "BugComment" DROP COLUMN "comment";

-- AlterTable
ALTER TABLE "ProjectEnvironment" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "TestSuiteRun" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "GitIntegration";

-- DropTable
DROP TABLE "Webhook";

-- DropTable
DROP TABLE "WebhookDelivery";

-- DropTable
DROP TABLE "WebhookLog";
