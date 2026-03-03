/**
 * USER PROFILE ROUTES
 * Self-service profile management for authenticated users
 */

import { createAuthGuards } from '../lib/rbac.js';
import { logError } from '../lib/logger.js';
import { getCloudinary } from '../lib/cloudinary.js';
import {
  getCurrentUserProfile,
  getPublicUserProfile,
  updateCurrentUserProfile,
  getUserStatistics,
} from '../services/userProfileService.js';

const CLOUDINARY_FOLDER_ROOT = process.env.CLOUDINARY_FOLDER_ROOT || 'testtrack-pro';

export async function userProfileRoutes(fastify) {
  const { requireAuth } = createAuthGuards(fastify);

  /**
   * GET /api/users/me
   * Get current user's complete profile
   */
  fastify.get(
    '/api/users/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const profile = await getCurrentUserProfile(userId);
        reply.send(profile);
      } catch (error) {
        logError('Error fetching user profile:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * PATCH /api/users/me
   * Update current user's profile (name, picture)
   */
  fastify.patch(
    '/api/users/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { name, picture } = request.body;

        const updatedProfile = await updateCurrentUserProfile(userId, {
          name,
          picture,
        });

        reply.send({
          message: 'Profile updated successfully',
          user: updatedProfile,
        });
      } catch (error) {
        logError('Error updating user profile:', error);
        reply.code(400).send({ error: error.message });
      }
    },
  );

  /**
   * POST /api/users/me/photo
   * Upload profile photo to Cloudinary
   */
  fastify.post(
    '/api/users/me/photo',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const data = await request.file();

        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.code(400).send({ 
            error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
          });
        }

        // Read file buffer
        const chunks = [];
        for await (const chunk of data.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (buffer.length > maxSize) {
          return reply.code(400).send({ 
            error: 'File too large. Maximum size is 5MB.' 
          });
        }

        // Upload to Cloudinary
        const cloudinary = getCloudinary();
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `${CLOUDINARY_FOLDER_ROOT}/profiles`,
              public_id: `user_${userId}`,
              overwrite: true,
              resource_type: 'image',
              transformation: [
                { width: 256, height: 256, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(buffer);
        });

        // Update user profile with new picture URL
        const updatedProfile = await updateCurrentUserProfile(userId, {
          picture: uploadResult.secure_url,
        });

        reply.send({
          message: 'Profile photo uploaded successfully',
          user: updatedProfile,
          photoUrl: uploadResult.secure_url,
        });
      } catch (error) {
        logError('Error uploading profile photo:', error);
        reply.code(500).send({ error: error.message || 'Failed to upload photo' });
      }
    },
  );

  /**
   * DELETE /api/users/me/photo
   * Remove profile photo
   */
  fastify.delete(
    '/api/users/me/photo',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        // Remove from Cloudinary
        const cloudinary = getCloudinary();
        try {
          await cloudinary.uploader.destroy(
            `${CLOUDINARY_FOLDER_ROOT}/profiles/user_${userId}`,
          );
        } catch {
          // Ignore if image doesn't exist
        }

        // Update user profile to remove picture
        const updatedProfile = await updateCurrentUserProfile(userId, {
          picture: null,
        });

        reply.send({
          message: 'Profile photo removed successfully',
          user: updatedProfile,
        });
      } catch (error) {
        logError('Error removing profile photo:', error);
        reply.code(500).send({ error: error.message || 'Failed to remove photo' });
      }
    },
  );

  /**
   * GET /api/users/me/statistics
   * Get current user's activity statistics
   */
  fastify.get(
    '/api/users/me/statistics',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const statistics = await getUserStatistics(userId);
        reply.send(statistics);
      } catch (error) {
        logError('Error fetching user statistics:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * GET /api/users/:id
   * Get public profile of any user (limited information)
   */
  fastify.get(
    '/api/users/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = parseInt(request.params.id);

        if (isNaN(userId)) {
          return reply.code(400).send({ error: 'Invalid user ID' });
        }

        const profile = await getPublicUserProfile(userId);
        reply.send(profile);
      } catch (error) {
        logError('Error fetching public user profile:', error);
        const statusCode = error.message === 'User not found' ? 404 : 500;
        reply.code(statusCode).send({ error: error.message });
      }
    },
  );

  /**
   * DELETE /api/users/me
   * Soft delete current user's account (deactivate)
   */
  fastify.delete(
    '/api/users/me',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { password, reason } = request.body || {};

        // Verify password for security
        if (!password) {
          return reply.code(400).send({ error: 'Password is required to delete account' });
        }

        // Get user and verify password
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, password: true, email: true, role: true },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return reply.code(401).send({ error: 'Incorrect password' });
        }

        // Prevent admins from deleting themselves if they're the only admin
        if (user.role === 'ADMIN') {
          const adminCount = await prisma.user.count({
            where: { role: 'ADMIN', isActive: true },
          });
          if (adminCount <= 1) {
            return reply.code(400).send({ 
              error: 'Cannot delete account. You are the only active administrator.' 
            });
          }
        }

        // Soft delete: deactivate the account
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            deletedAt: new Date(),
            deleteReason: reason || 'User requested account deletion',
          },
        });

        // Log the action
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'ACCOUNT_DELETED',
            resourceType: 'USER',
            resourceId: userId.toString(),
            details: { reason: reason || 'User requested account deletion' },
          },
        });

        reply.send({
          message: 'Account has been deactivated successfully. You can contact support to reactivate it.',
        });
      } catch (error) {
        logError('Error deleting user account:', error);
        reply.code(500).send({ error: error.message || 'Failed to delete account' });
      }
    },
  );
}

export default userProfileRoutes;
