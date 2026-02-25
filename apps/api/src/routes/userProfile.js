/**
 * USER PROFILE ROUTES
 * Self-service profile management for authenticated users
 */

import { createAuthGuards } from '../lib/rbac.js';
import { logError } from '../lib/logger.js';
import {
  getCurrentUserProfile,
  getPublicUserProfile,
  updateCurrentUserProfile,
  getUserStatistics,
} from '../services/userProfileService.js';

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
}

export default userProfileRoutes;
