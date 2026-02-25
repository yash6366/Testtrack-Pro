/**
 * USER PROFILE SERVICE
 * Handles user profile viewing and self-service updates
 */

import { getPrismaClient } from '../lib/prisma.js';
import { logAuditAction } from './auditService.js';

const prisma = getPrismaClient();

/**
 * Get current user's profile
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      picture: true,
      role: true,
      isVerified: true,
      isActive: true,
      isMuted: true,
      mutedUntil: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      projectAllocations: {
        where: { isActive: true },
        select: {
          id: true,
          projectRole: true,
          allocatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              status: true,
            },
          },
        },
      },
      oauthIntegrations: {
        select: {
          id: true,
          provider: true,
          email: true,
          createdAt: true,
        },
      },
      notificationPreferences: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Get public user profile (limited info)
 * @param {number} userId - User ID to view
 * @returns {Promise<Object>} Public user profile
 */
export async function getPublicUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      picture: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Update current user's profile
 * @param {number} userId - User ID
 * @param {Object} data - Profile update data
 * @param {string} data.name - Updated name
 * @param {string} data.picture - Updated picture URL
 * @returns {Promise<Object>} Updated user profile
 */
export async function updateCurrentUserProfile(userId, data) {
  const { name, picture } = data;

  // Build update data
  const updateData = {};

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    updateData.name = name.trim();
  }

  if (picture !== undefined) {
    // Allow null/empty to remove picture
    updateData.picture = picture && typeof picture === 'string' ? picture.trim() : null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      picture: true,
      role: true,
      isVerified: true,
      isActive: true,
      updatedAt: true,
    },
  });

  // Log audit action
  await logAuditAction(userId, 'PROFILE_UPDATED', {
    resourceType: 'USER',
    resourceId: userId,
    resourceName: user.name,
    description: 'Updated own profile',
    newValues: updateData,
  });

  return user;
}

/**
 * Get user statistics (for profile dashboard)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
export async function getUserStatistics(userId) {
  const [
    createdTestCasesCount,
    assignedTestCasesCount,
    testExecutionsCount,
    reportedBugsCount,
    assignedBugsCount,
  ] = await Promise.all([
    prisma.testCase.count({ where: { createdBy: userId, isDeleted: false } }),
    prisma.testCase.count({ where: { assignedToId: userId, isDeleted: false } }),
    prisma.testExecution.count({ where: { userId } }),
    prisma.bug.count({ where: { reportedBy: userId } }),
    prisma.bug.count({ where: { assigneeId: userId } }),
  ]);

  return {
    createdTestCases: createdTestCasesCount,
    assignedTestCases: assignedTestCasesCount,
    testExecutions: testExecutionsCount,
    reportedBugs: reportedBugsCount,
    assignedBugs: assignedBugsCount,
  };
}
