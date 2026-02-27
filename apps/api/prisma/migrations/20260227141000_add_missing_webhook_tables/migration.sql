-- CreateTable (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WebhookDelivery') THEN
        CREATE TABLE "WebhookDelivery" (
            "id" SERIAL NOT NULL,
            "webhookId" INTEGER NOT NULL,
            "event" TEXT NOT NULL,
            "payload" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "attemptCount" INTEGER NOT NULL DEFAULT 0,
            "scheduledAt" TIMESTAMP(3) NOT NULL,
            "deliveredAt" TIMESTAMP(3),
            "responseCode" INTEGER,
            "responseBody" TEXT,
            "errorMessage" TEXT,
            "durationMs" INTEGER,
            "nextRetryAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
        CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");
        CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");
        CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

        -- AddForeignKey
        ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WebhookLog') THEN
        CREATE TABLE "WebhookLog" (
            "id" SERIAL NOT NULL,
            "webhookId" INTEGER NOT NULL,
            "event" TEXT NOT NULL,
            "payload" TEXT,
            "responseStatus" INTEGER,
            "responseBody" TEXT,
            "error" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE INDEX "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");
        CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");
    END IF;
END
$$;
