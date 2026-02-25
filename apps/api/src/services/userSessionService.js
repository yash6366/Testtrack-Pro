/**
 * USER SESSION SERVICE
 * Handles user session viewing and management
 */

import { getPrismaClient } from '../lib/prisma.js';

const prisma = getPrismaClient();

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of active sessions
 */
export async function getUserSessions(userId) {
  const now = new Date();

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceLabel: true,
      createdAt: true,
      lastUsedAt: true,
      rotatedAt: true,
      expiresAt: true,
    },
    orderBy: {
      lastUsedAt: 'desc',
    },
  });

  return sessions.map(session => ({
    ...session,
    isCurrent: false, // Will be updated by the route handler if needed
  }));
}

/**
 * Get session details
 * @param {number} sessionId - Session ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Session details
 */
export async function getSessionDetails(sessionId, userId) {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      deviceLabel: true,
      createdAt: true,
      lastUsedAt: true,
      rotatedAt: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Unauthorized access to session');
  }

  return session;
}

/**
 * Revoke a specific session
 * @param {number} sessionId - Session ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Result
 */
export async function revokeSession(sessionId, userId) {
  // Check if session belongs to user
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, revokedAt: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Unauthorized access to session');
  }

  if (session.revokedAt) {
    throw new Error('Session already revoked');
  }

  // Revoke the session
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return { message: 'Session revoked successfully' };
}

/**
 * Revoke all sessions except the current one
 * @param {number} userId - User ID
 * @param {number} currentSessionId - Current session ID to keep
 * @returns {Promise<Object>} Result
 */
export async function revokeAllOtherSessions(userId, currentSessionId) {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      id: { not: currentSessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return {
    message: 'All other sessions revoked successfully',
    revokedCount: result.count,
  };
}

/**
 * Get session statistics for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Session statistics
 */
export async function getSessionStatistics(userId) {
  const now = new Date();

  const [totalSessions, activeSessions, revokedSessions] = await Promise.all([
    prisma.userSession.count({ where: { userId } }),
    prisma.userSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
    prisma.userSession.count({
      where: {
        userId,
        revokedAt: { not: null },
      },
    }),
  ]);

  return {
    total: totalSessions,
    active: activeSessions,
    revoked: revokedSessions,
    expired: totalSessions - activeSessions - revokedSessions,
  };
}
