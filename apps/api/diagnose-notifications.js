/**
 * Comprehensive Notification System Diagnostics
 * This script checks all aspects of the notification delivery system
 */

import { getPrismaClient } from './src/lib/prisma.js';
import { logInfo, logError } from './src/lib/logger.js';

const prisma = getPrismaClient();

async function diagnoseNotificationSystem() {
  console.log('🔍 COMPREHENSIVE NOTIFICATION SYSTEM DIAGNOSTICS\n');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Check database connection
    console.log('1️⃣  Database Connection Check:');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('   ✅ Database connected\n');
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}\n`);
      process.exit(1);
    }

    // 2. Check if notification table exists and has data
    console.log('2️⃣  Notification Table Analysis:');
    const notificationCount = await prisma.notification.count();
    console.log(`   Total notifications: ${notificationCount}`);
    
    const unreadCount = await prisma.notification.count({
      where: { isRead: false },
    });
    console.log(`   Unread notifications: ${unreadCount}`);
    
    const recentNotifications = await prisma.notification.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    if (recentNotifications.length > 0) {
      console.log('   Recent notifications:');
      recentNotifications.forEach((notif, idx) => {
        console.log(`     ${idx + 1}. [${notif.type}] ${notif.title} (User: ${notif.userId})`);
      });
    } else {
      console.log('   ℹ️  No notifications found');
    }
    console.log();

    // 3. Check NotificationDelivery table status
    console.log('3️⃣  Notification Delivery Status Analysis:');
    const deliveryStats = await prisma.notificationDelivery.groupBy({
      by: ['status', 'channel'],
      _count: true,
    });

    const deliveryByStatus = {};
    const deliveryByChannel = {};

    for (const stat of deliveryStats) {
      if (!deliveryByStatus[stat.status]) deliveryByStatus[stat.status] = 0;
      if (!deliveryByChannel[stat.channel]) deliveryByChannel[stat.channel] = 0;
      deliveryByStatus[stat.status] += stat._count;
      deliveryByChannel[stat.channel] += stat._count;
    }

    console.log('   By Status:');
    for (const [status, count] of Object.entries(deliveryByStatus).sort()) {
      const icon =
        status === 'DELIVERED'
          ? '✅'
          : status === 'FAILED'
            ? '❌'
            : status === 'BOUNCED'
              ? '🚫'
              : status === 'PENDING'
                ? '⏳'
                : '❓';
      console.log(`     ${icon} ${status}: ${count}`);
    }

    console.log('\n   By Channel:');
    for (const [channel, count] of Object.entries(deliveryByChannel).sort()) {
      const icon =
        channel === 'EMAIL'
          ? '📧'
          : channel === 'IN_APP'
            ? '💬'
            : channel === 'PUSH'
              ? '🔔'
              : '❓';
      console.log(`     ${icon} ${channel}: ${count}`);
    }
    console.log();

    // 4. Check failed deliveries ready for retry
    console.log('4️⃣  Failed Deliveries Ready for Retry:');
    const failedDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: 3 },
        nextRetryAt: { lte: new Date() },
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
      take: 10,
    });

    if (failedDeliveries.length > 0) {
      console.log(`   Found ${failedDeliveries.length} failed deliveries ready for retry:`);
      failedDeliveries.forEach((delivery, idx) => {
        console.log(`\n     ${idx + 1}. Delivery ID: ${delivery.id}`);
        console.log(`        Notification: "${delivery.notification.title}"`);
        console.log(`        Channel: ${delivery.channel}`);
        console.log(`        Retry Count: ${delivery.retryCount}/3`);
        console.log(`        Failure Reason: ${delivery.failureReason || 'Not set'}`);
        console.log(`        Next Retry: ${delivery.nextRetryAt}`);
        console.log(`        User ID: ${delivery.notification.userId}`);
      });
    } else {
      console.log('   ✅ No failed deliveries waiting for retry');
      
      // Check if there are ANY failed deliveries
      const totalFailed = await prisma.notificationDelivery.count({
        where: { status: 'FAILED' },
      });
      
      if (totalFailed > 0) {
        console.log(`   ℹ️  Note: ${totalFailed} failed deliveries exist but nextRetryAt has not arrived yet`);
      }
    }
    console.log();

    // 5. Check for bounced deliveries (max retries exceeded)
    console.log('5️⃣  Bounced Deliveries (Max Retries Exceeded):');
    const bouncedDeliveries = await prisma.notificationDelivery.findMany({
      where: { status: 'BOUNCED' },
      include: {
        notification: {
          select: {
            title: true,
            type: true,
            userId: true,
          },
        },
      },
      take: 5,
    });

    if (bouncedDeliveries.length > 0) {
      console.log(`   Found ${bouncedDeliveries.length} bounced deliveries:`);
      bouncedDeliveries.forEach((delivery, idx) => {
        console.log(`     ${idx + 1}. "${delivery.notification.title}" via ${delivery.channel}`);
        console.log(`        Reason: ${delivery.failureReason}`);
      });
    } else {
      console.log('   ✅ No bounced deliveries');
    }
    console.log();

    // 6. Check pending deliveries (still waiting to be delivered)
    console.log('6️⃣  Pending Deliveries (Not Yet Delivered):');
    const pendingDeliveries = await prisma.notificationDelivery.findMany({
      where: { status: 'PENDING' },
      include: {
        notification: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      take: 5,
    });

    if (pendingDeliveries.length > 0) {
      console.log(`   ⚠️  Found ${pendingDeliveries.length} pending deliveries:`);
      pendingDeliveries.forEach((delivery, idx) => {
        console.log(`     ${idx + 1}. "${delivery.notification.title}" via ${delivery.channel}`);
      });
      console.log('   These should be delivered immediately, not wait for retry');
    } else {
      console.log('   ✅ No pending deliveries (all are either delivered, failed, or bounced)');
    }
    console.log();

    // 7. Check for stale failed deliveries
    console.log('7️⃣  Stale Failed Deliveries Analysis:');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const staleFailedDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: 'FAILED',
        createdAt: { lt: thirtyMinutesAgo },
      },
      select: {
        id: true,
        channel: true,
        failureReason: true,
        retryCount: true,
        nextRetryAt: true,
        createdAt: true,
      },
      take: 5,
    });

    if (staleFailedDeliveries.length > 0) {
      console.log(`   ⚠️  Found ${staleFailedDeliveries.length} failed deliveries older than 30 minutes:`);
      staleFailedDeliveries.forEach((delivery, idx) => {
        const age = Math.floor((Date.now() - delivery.createdAt) / 1000 / 60);
        console.log(`     ${idx + 1}. Age: ${age} minutes`);
        console.log(`        Channel: ${delivery.channel}`);
        console.log(`        Retry Count: ${delivery.retryCount}`);
        console.log(`        Reason: ${delivery.failureReason}`);
        console.log(`        Next Retry: ${delivery.nextRetryAt}`);
      });
    } else {
      console.log('   ✅ No stale failed deliveries');
    }
    console.log();

    // 8. Check email configuration
    console.log('8️⃣  Email Configuration Check:');
    const resendKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    
    if (resendKey) {
      console.log(`   ✅ RESEND_API_KEY is set (${resendKey.substring(0, 10)}...)`);
    } else {
      console.log(`   ❌ RESEND_API_KEY is NOT set - email sending will fail!`);
    }

    if (resendFromEmail) {
      console.log(`   ✅ RESEND_FROM_EMAIL is set: ${resendFromEmail}`);
    } else {
      console.log(`   ⚠️  RESEND_FROM_EMAIL not set - will use default`);
    }
    console.log();

    // 9. Check users with email addresses
    console.log('9️⃣  Sample Users:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 5,
    });

    const usersWithEmail = allUsers.filter(u => u.email && u.email.trim() !== '');

    if (usersWithEmail.length > 0) {
      console.log(`   ✅ Found ${usersWithEmail.length} users with email addresses:`);
      usersWithEmail.forEach((user) => {
        console.log(`     • ${user.name || 'N/A'} - ${user.email}`);
      });
    } else {
      console.log(`   ⚠️  No users with email addresses found!`);
    }
    console.log();

    // 10. Summary and recommendations
    console.log('🎯 SUMMARY & RECOMMENDATIONS:\n');

    let Issues = [];
    let recommendations = [];

    if (!resendKey) {
      Issues.push('RESEND_API_KEY not configured');
      recommendations.push(
        '→ Set RESEND_API_KEY environment variable to enable email notifications'
      );
    }

    if (usersWithEmail.length === 0) {
      Issues.push('No users have email addresses');
      recommendations.push(
        '→ Ensure users are created with email addresses for email notifications'
      );
    }

    if (deliveryByStatus.PENDING > 0) {
      Issues.push('Pending deliveries found (should be delivered immediately)');
      recommendations.push(
        '→ Check if Socket.IO is properly initialized and EMAIL service is configured'
      );
    }

    if (failedDeliveries.length > 0) {
      Issues.push(`${failedDeliveries.length} failed deliveries waiting for retry`);
      recommendations.push(
        '→ Check logs for specific failure reasons'
      );
      recommendations.push(
        `→ Verify the retry job runs every 5 minutes to process these`
      );
    }

    if (bouncedDeliveries.length > 0) {
      Issues.push(`${bouncedDeliveries.length} deliveries bounced after max retries`);
      recommendations.push(
        '→ Review failure reasons for these bounced deliveries'
      );
    }

    if (Issues.length === 0) {
      console.log('✅ All systems normal!');
      console.log('   • Notification system is working correctly');
      console.log('   • No failed deliveries pending retry');
      console.log('   • All deliveries are either delivered or properly configured for retry');
    } else {
      console.log('⚠️  Issues Found:');
      Issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });

      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec) => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('End of diagnostic report');

  } catch (error) {
    logError('Error in notification diagnostics', { error });
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
diagnoseNotificationSystem().catch(console.error);
