/**
 * USER SESSION ROUTES
 * Session management for authenticated users
 */

import { createAuthGuards } from '../lib/rbac.js';
import { logError } from '../lib/logger.js';
import crypto from 'crypto';
import {
  getUserSessions,
  getSessionDetails,
  revokeSession,
  revokeAllOtherSessions,
  getSessionStatistics,
} from '../services/userSessionService.js';

export async function userSessionRoutes(fastify) {
  const { requireAuth } = createAuthGuards(fastify);

  /**
   * Helper to get current session ID from request
   * Extract from refresh token if available in request body or header
   */
  function getCurrentSessionId(request) {
    const refreshToken = request.body?.refreshToken || request.headers['x-refresh-token'];
    
    if (!refreshToken) {
      return null;
    }

    try {
      // Hash the refresh token to match database
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      return hash;
    } catch {
      return null;
    }
  }

  /**
   * GET /api/users/sessions
   * Get all active sessions for current user
   */
  fastify.get(
    '/api/users/sessions',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const sessions = await getUserSessions(userId);
        
        // Try to mark current session
        const currentSessionHash = getCurrentSessionId(request);
        if (currentSessionHash) {
          sessions.forEach(session => {
            // We can't directly compare hash with ID, but we can compare timestamps
            // The most recently used is likely the current one
            session.isCurrent = false;
          });
          // Mark the most recent as current (simplified approach)
          if (sessions.length > 0) {
            sessions[0].isCurrent = true;
          }
        }

        reply.send({ sessions });
      } catch (error) {
        logError('Error fetching user sessions:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * GET /api/users/sessions/statistics
   * Get session statistics for current user
   */
  fastify.get(
    '/api/users/sessions/statistics',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const statistics = await getSessionStatistics(userId);
        reply.send(statistics);
      } catch (error) {
        logError('Error fetching session statistics:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * GET /api/users/sessions/:id
   * Get details of a specific session
   */
  fastify.get(
    '/api/users/sessions/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const sessionId = parseInt(request.params.id);

        if (isNaN(sessionId)) {
          return reply.code(400).send({ error: 'Invalid session ID' });
        }

        const session = await getSessionDetails(sessionId, userId);
        reply.send(session);
      } catch (error) {
        logError('Error fetching session details:', error);
        const statusCode = error.message.includes('Unauthorized') ? 403 : 
                          error.message.includes('not found') ? 404 : 500;
        reply.code(statusCode).send({ error: error.message });
      }
    },
  );

  /**
   * DELETE /api/users/sessions/:id
   * Revoke a specific session
   */
  fastify.delete(
    '/api/users/sessions/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const sessionId = parseInt(request.params.id);

        if (isNaN(sessionId)) {
          return reply.code(400).send({ error: 'Invalid session ID' });
        }

        const result = await revokeSession(sessionId, userId);
        reply.send(result);
      } catch (error) {
        logError('Error revoking session:', error);
        const statusCode = error.message.includes('Unauthorized') ? 403 : 
                          error.message.includes('not found') ? 404 : 400;
        reply.code(statusCode).send({ error: error.message });
      }
    },
  );

  /**
   * POST /api/users/sessions/revoke-all-others
   * Revoke all sessions except the current one
   */
  fastify.post(
    '/api/users/sessions/revoke-all-others',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { currentSessionId } = request.body;

        if (!currentSessionId || isNaN(parseInt(currentSessionId))) {
          return reply.code(400).send({ 
            error: 'Current session ID is required to prevent self-lockout',
          });
        }

        const result = await revokeAllOtherSessions(userId, parseInt(currentSessionId));
        reply.send(result);
      } catch (error) {
        logError('Error revoking sessions:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );
}

export default userSessionRoutes;
