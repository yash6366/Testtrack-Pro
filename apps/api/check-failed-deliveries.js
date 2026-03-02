/**
 * Check failed deliveries in the database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Failed Notification Deliveries ===\n');
  
  const failedNotifications = await prisma.notificationDelivery.findMany({
    where: {
      status: 'FAILED',
    },
    include: {
      notification: {
        select: {
          id: true,
          title: true,
          type: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`Total Failed Notification Deliveries: ${failedNotifications.length}\n`);
  
  if (failedNotifications.length > 0) {
    failedNotifications.forEach((delivery, index) => {
      console.log(`${index + 1}. Delivery ID: ${delivery.id}`);
      console.log(`   Notification: ${delivery.notification?.title || 'N/A'}`);
      console.log(`   Type: ${delivery.notification?.type || 'N/A'}`);
      console.log(`   Channel: ${delivery.channel}`);
      console.log(`   Status: ${delivery.status}`);
      console.log(`   Failure Reason: ${delivery.failureReason || 'N/A'}`);
      console.log(`   Retry Count: ${delivery.retryCount}`);
      console.log(`   Next Retry: ${delivery.nextRetryAt || 'N/A'}`);
      console.log(`   Created: ${delivery.createdAt}`);
      console.log('');
    });
  }

  console.log('\n=== Checking Failed Webhook Deliveries ===\n');
  
  const failedWebhooks = await prisma.webhookDelivery.findMany({
    where: {
      OR: [
        { status: 'FAILED' },
        { status: 'PENDING' },
      ],
    },
    include: {
      webhook: {
        select: {
          id: true,
          name: true,
          url: true,
          isActive: true,
          failureCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`Total Failed/Pending Webhook Deliveries: ${failedWebhooks.length}\n`);
  
  if (failedWebhooks.length > 0) {
    failedWebhooks.forEach((delivery, index) => {
      console.log(`${index + 1}. Delivery ID: ${delivery.id}`);
      console.log(`   Webhook: ${delivery.webhook?.name || 'N/A'}`);
      console.log(`   URL: ${delivery.webhook?.url || 'N/A'}`);
      console.log(`   Active: ${delivery.webhook?.isActive}`);
      console.log(`   Event: ${delivery.event}`);
      console.log(`   Status: ${delivery.status}`);
      console.log(`   Attempt Count: ${delivery.attemptCount}`);
      console.log(`   Error: ${delivery.errorMessage || 'N/A'}`);
      console.log(`   Response Code: ${delivery.responseCode || 'N/A'}`);
      console.log(`   Next Retry: ${delivery.nextRetryAt || 'N/A'}`);
      console.log(`   Created: ${delivery.createdAt}`);
      console.log('');
    });
  }

  // Check for webhooks with high failure counts
  console.log('\n=== Checking Webhooks with Issues ===\n');
  
  const problematicWebhooks = await prisma.webhook.findMany({
    where: {
      OR: [
        { isActive: false },
        { failureCount: { gte: 3 } },
      ],
    },
    select: {
      id: true,
      name: true,
      url: true,
      isActive: true,
      failureCount: true,
      lastFailureAt: true,
      lastSuccessAt: true,
      projectId: true,
    },
    orderBy: {
      failureCount: 'desc',
    },
  });

  console.log(`Total Webhooks with Issues: ${problematicWebhooks.length}\n`);
  
  if (problematicWebhooks.length > 0) {
    problematicWebhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. Webhook ID: ${webhook.id}`);
      console.log(`   Name: ${webhook.name}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Active: ${webhook.isActive ? '✓' : '✗ DISABLED'}`);
      console.log(`   Project ID: ${webhook.projectId}`);
      console.log(`   Failure Count: ${webhook.failureCount}`);
      console.log(`   Last Success: ${webhook.lastSuccessAt || 'Never'}`);
      console.log(`   Last Failure: ${webhook.lastFailureAt || 'N/A'}`);
      console.log('');
    });
  }

  // Summary stats
  console.log('\n=== Summary ===\n');
  
  const notificationStats = await prisma.notificationDelivery.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('Notification Delivery Status:');
  notificationStats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count}`);
  });

  const webhookStats = await prisma.webhookDelivery.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\nWebhook Delivery Status:');
  webhookStats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
