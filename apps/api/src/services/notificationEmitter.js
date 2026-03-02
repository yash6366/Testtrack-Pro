/**
 * NOTIFICATION EMITTER SERVICE
 * Handles real-time notification delivery via Socket.IO
 * Tracks delivery status and retries failed notifications
 */

import { getPrismaClient } from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';
import { sendNotificationEmail } from './emailService.js';

const prisma = getPrismaClient();

let ioInstance = null;

/**
 * Initialize the notification emitter with Socket.IO instance
 * @param {Server} io - Socket.IO server instance
 */
export function initializeNotificationEmitter(io) {
  ioInstance = io;
}

/**
 * Emit notification to user via WebSocket and track delivery
 * @param {number} userId - Target user ID
 * @param {Object} notification - Notification object from database
 * @param {boolean} sendEmail - Whether to send email
 * @param {boolean} skipInApp - Skip in-app notification delivery
 */
export async function emitNotificationToUser(userId, notification, sendEmail = false, skipInApp = false) {
  if (!ioInstance) {
    return;
  }

  const userRoom = `user:${userId}`;

  // Prepare notification payload
  const payload = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    actionUrl: notification.actionUrl,
    actionType: notification.actionType,
    relatedUserId: notification.relatedUserId,
    metadata: parseNotificationMetadata(notification.metadata),
    createdAt: notification.createdAt,
    isRead: notification.isRead,
  };

  // Track in-app delivery
  if (!skipInApp) {
    try {
      await createDeliveryRecord(notification.id, 'IN_APP', 'PENDING');

      // Emit via Socket.IO
      ioInstance.to(userRoom).emit('notification:new', payload);

      // Update delivery as delivered
      await updateDeliveryStatus(notification.id, 'IN_APP', 'DELIVERED', new Date());
    } catch (error) {
      await updateDeliveryStatus(notification.id, 'IN_APP', 'FAILED', null, error.message);
    }
  }

  // Track email delivery (if enabled)
  if (sendEmail) {
    try {
      await createDeliveryRecord(notification.id, 'EMAIL', 'PENDING');
      
      // Get user email from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (user && user.email) {
        try {
          // Send notification email
          await sendNotificationEmail(user.email, {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            sourceType: notification.sourceType,
            sourceId: notification.sourceId,
            actionUrl: notification.actionUrl,
            actionType: notification.actionType,
          });

          // Mark email as delivered
          await updateDeliveryStatus(notification.id, 'EMAIL', 'DELIVERED', new Date());
        } catch (emailError) {
          logError('Failed to send notification email', { error: emailError, userId, notificationId: notification.id });
          // Mark email delivery as failed for retry
          await updateDeliveryStatus(notification.id, 'EMAIL', 'FAILED', null, emailError.message);
        }
      } else {
        // No email found for user
        await updateDeliveryStatus(notification.id, 'EMAIL', 'BOUNCED', null, 'User email not found');
      }
    } catch (error) {
      logError('Error in email delivery tracking', { error, userId, notificationId: notification.id });
    }
  }
}

/**
 * Broadcast notification to all users in a role
 * @param {string} role - Role (ADMIN, DEVELOPER, TESTER)
 * @param {Object} notification - Notification data
 */
export async function broadcastToRole(role, notification) {
  if (!ioInstance) return;

  const roleRoom = `role:${role.toUpperCase()}`;
  const payload = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
  };

  ioInstance.to(roleRoom).emit('role:announcement', payload);
}

/**
 * Broadcast notification to project members
 * @param {number} projectId - Project ID
 * @param {Object} notification - Notification data
 */
export async function broadcastToProject(projectId, notification) {
  if (!ioInstance) return;

  const projectRoom = `project:${projectId}`;
  const payload = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    createdAt: notification.createdAt,
  };

  ioInstance.to(projectRoom).emit('project:update', payload);
  logInfo('Broadcast notification to project', { projectId, notificationId: notification.id });
}

/**
 * Create delivery record for notification channel
 * @param {number} notificationId - Notification ID
 * @param {string} channel - Delivery channel (EMAIL, IN_APP, PUSH)
 * @param {string} status - Initial status (PENDING)
 */
export async function createDeliveryRecord(notificationId, channel, status = 'PENDING') {
  try {
    return await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel,
        status,
      },
    });
  } catch (error) {
    logError('Failed to create delivery record', { error, notificationId, channel });
    throw error;
  }
}

/**
 * Update delivery status
 * @param {number} notificationId - Notification ID
 * @param {string} channel - Channel
 * @param {string} status - New status
 * @param {Date} timestamp - Timestamp field to update (sentAt, deliveredAt, openedAt)
 * @param {string} failureReason - Optional failure reason
 */
export async function updateDeliveryStatus(
  notificationId,
  channel,
  status,
  timestamp = null,
  failureReason = null,
) {
  try {
    const data = { status };

    if (status === 'DELIVERED') {
      data.deliveredAt = timestamp || new Date();
    } else if (status === 'OPENED') {
      data.openedAt = timestamp || new Date();
    } else if (status === 'FAILED') {
      data.failureReason = failureReason || 'Unknown error';
      data.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
      data.retryCount = { increment: 1 };
    }

    return await prisma.notificationDelivery.updateMany({
      where: {
        notificationId,
        channel,
      },
      data,
    });
  } catch (error) {
    logError('Failed to update delivery status', { error, notificationId, channel, status });
    throw error;
  }
}

/**
 * Mark notification as opened/read
 * @param {number} notificationId - Notification ID
 */
export async function markNotificationOpened(notificationId) {
  try {
    await Promise.all([
      prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      }),
      updateDeliveryStatus(notificationId, 'IN_APP', 'OPENED'),
    ]);
  } catch (error) {
    logError('Failed to mark notification as opened', { error, notificationId });
  }
}

/**
 * Retry failed deliveries
 * @returns {Promise<Object>} Retry result
 */
export async function retryFailedDeliveries() {
  try {
    const failedDeliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: 3 },
        nextRetryAt: { lte: new Date() },
      },
      include: {
        notification: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
      take: 100, // Limit to 100 per batch
    });

    logInfo('Retrying failed notification deliveries', { count: failedDeliveries.length });

    let succeeded = 0;
    let failed = 0;

    for (const delivery of failedDeliveries) {
      let retrySuccess = false;
      let retryError = null;

      try {
        if (delivery.channel === 'IN_APP') {
          // Emit via Socket.IO again
          if (ioInstance) {
            const userRoom = `user:${delivery.notification.userId}`;
            ioInstance.to(userRoom).emit('notification:new', {
              id: delivery.notification.id,
              title: delivery.notification.title,
              message: delivery.notification.message,
              type: delivery.notification.type,
            });

            retrySuccess = true;
          } else {
            throw new Error('Socket.IO instance not initialized');
          }
        } else if (delivery.channel === 'EMAIL') {
          // Retry email delivery
          if (delivery.notification.user && delivery.notification.user.email) {
            await sendNotificationEmail(delivery.notification.user.email, {
              id: delivery.notification.id,
              title: delivery.notification.title,
              message: delivery.notification.message,
              type: delivery.notification.type,
              sourceType: delivery.notification.sourceType,
              sourceId: delivery.notification.sourceId,
              actionUrl: delivery.notification.actionUrl,
              actionType: delivery.notification.actionType,
            });

            retrySuccess = true;
          } else {
            throw new Error('User email not found');
          }
        }
      } catch (error) {
        retryError = error;
        retrySuccess = false;
      }

      // Update delivery status based on result
      if (retrySuccess) {
        // Mark as delivered
        await updateDeliveryStatus(
          delivery.notificationId,
          delivery.channel,
          'DELIVERED',
        );
        succeeded++;
      } else {
        // Mark as failed again for retry or mark as bounced if max retries exceeded
        logError('Retry failed for delivery', { error: retryError, deliveryId: delivery.id, notificationId: delivery.notificationId, channel: delivery.channel, retryCount: delivery.retryCount });

        if (delivery.retryCount >= 2) {
          // Mark as bounced after 3 attempts (retryCount 0, 1, 2 = 3 attempts)
          await updateDeliveryStatus(
            delivery.notificationId,
            delivery.channel,
            'BOUNCED',
            null,
            `Max retries exceeded: ${retryError.message}`,
          );
        } else {
          // Mark as failed again for next retry
          await updateDeliveryStatus(
            delivery.notificationId,
            delivery.channel,
            'FAILED',
            null,
            retryError.message,
          );
        }
        failed++;
      }
    }

    return { attempted: failedDeliveries.length, succeeded, failed };
  } catch (error) {
    logError('Error in retryFailedDeliveries', { error });
    throw error;
  }
}

function parseNotificationMetadata(metadata) {
  if (!metadata) return null;
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  }
  return metadata;
}

/**
 * Get notification delivery status
 * @param {number} notificationId - Notification ID
 */
export async function getDeliveryStatus(notificationId) {
  try {
    return await prisma.notificationDelivery.findMany({
      where: { notificationId },
    });
  } catch (error) {
    logError('Failed to get delivery status', { error, notificationId });
    throw error;
  }
}

/**
 * Clean up old delivery records (older than 30 days)
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupOldDeliveries() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.notificationDelivery.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: { in: ['DELIVERED', 'BOUNCED'] },
      },
    });

    logInfo('Cleaned up old delivery records', { count: result.count });
    return result;
  } catch (error) {
    logError('Error cleaning up deliveries', { error });
    throw error;
  }
}

export default {
  initializeNotificationEmitter,
  emitNotificationToUser,
  broadcastToRole,
  broadcastToProject,
  createDeliveryRecord,
  updateDeliveryStatus,
  markNotificationOpened,
  retryFailedDeliveries,
  getDeliveryStatus,
  cleanupOldDeliveries,
};
