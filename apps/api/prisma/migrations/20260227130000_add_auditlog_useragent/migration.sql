-- AlterTable
-- Add missing userAgent column to AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;
