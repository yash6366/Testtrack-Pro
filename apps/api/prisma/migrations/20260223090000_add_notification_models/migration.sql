-- AlterTable
ALTER TABLE "Notification"
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "sourceId" INTEGER,
  ADD COLUMN "actionUrl" TEXT,
  ADD COLUMN "actionType" TEXT,
  ADD COLUMN "metadata" JSONB;

-- CreateTable
CREATE TABLE "NotificationPreference" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailBugCreated" BOOLEAN NOT NULL DEFAULT true,
  "emailBugAssigned" BOOLEAN NOT NULL DEFAULT true,
  "emailBugCommented" BOOLEAN NOT NULL DEFAULT true,
  "emailBugStatusChanged" BOOLEAN NOT NULL DEFAULT true,
  "emailTestFailed" BOOLEAN NOT NULL DEFAULT true,
  "emailMentioned" BOOLEAN NOT NULL DEFAULT true,
  "emailAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "inAppBugCreated" BOOLEAN NOT NULL DEFAULT true,
  "inAppBugAssigned" BOOLEAN NOT NULL DEFAULT true,
  "inAppBugCommented" BOOLEAN NOT NULL DEFAULT true,
  "inAppBugStatusChanged" BOOLEAN NOT NULL DEFAULT true,
  "inAppTestFailed" BOOLEAN NOT NULL DEFAULT true,
  "inAppMentioned" BOOLEAN NOT NULL DEFAULT true,
  "inAppAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
  "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
  "digestTime" TEXT NOT NULL DEFAULT '09:00',
  "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
  "quietHourStart" TEXT NOT NULL DEFAULT '22:00',
  "quietHourEnd" TEXT NOT NULL DEFAULT '08:00',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
  "id" SERIAL NOT NULL,
  "notificationId" INTEGER NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "NotificationDelivery"("notificationId");
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");
CREATE INDEX "NotificationDelivery_nextRetryAt_idx" ON "NotificationDelivery"("nextRetryAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
