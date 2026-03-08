import { signup, login, verifyEmail, logout, logoutAll, refreshSession, requestPasswordReset, resetPassword, changePassword } from '../services/authService.js';
import { createAuthGuards } from '../lib/rbac.js';
// ...existing code...
import { logError } from '../lib/logger.js';

const signupSchema = {
  tags: ['auth'],
  summary: 'User registration',
  description: 'Create a new user account',
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { 
        type: 'string', 
        minLength: 8,
        description: 'Must contain at least one uppercase, one lowercase, one number, and one special character',
      },
      role: { type: 'string', enum: ['DEVELOPER', 'TESTER'] },
    },
  },
  response: {
    201: {
      description: 'User created successfully',
      type: 'object',
      properties: {
        message: { type: 'string' },
        userId: { type: 'number' },
      },
    },
    400: {
      description: 'Validation error',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

const loginSchema = {
  tags: ['auth'],
  summary: 'User login',
  description: 'Authenticate and receive JWT token',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
      rememberMe: { type: 'boolean', description: 'Extend refresh token lifetime' },
    },
  },
  response: {
    200: {
      description: 'Login successful',
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT authentication token' },
        refreshToken: { type: 'string', description: 'Refresh token for session rotation' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'DEVELOPER', 'TESTER'] },
          },
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

const refreshSchema = {
  tags: ['auth'],
  summary: 'Refresh access token',
  description: 'Rotate refresh token and issue a new access token',
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
    },
  },
  response: {
    200: {
      description: 'Token refreshed successfully',
      type: 'object',
      properties: {
        token: { type: 'string' },
        refreshToken: { type: 'string' },
        user: { type: 'object' },
      },
    },
    400: {
      description: 'Refresh token error',
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

const logoutSchema = {
  tags: ['auth'],
};


async function authRoutes(fastify, opts) {
  // Initialize auth guards
  const { requireAuth } = createAuthGuards(fastify);

  // Register authentication routes

  fastify.post('/api/auth/login', {
    schema: loginSchema,
  }, async (request, reply) => {
    try {
      const { email, password, rememberMe } = request.body;
      const result = await login(fastify, { email, password, rememberMe }, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
      reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(401).send({ error: error.message });
    }
  });

  fastify.post('/api/auth/reset-password', async (request, reply) => {
    try {
      const { token, newPassword } = request.body;
      if (!token || !newPassword) {
        return reply.code(400).send({ error: 'Token and new password are required' });
      }
      const result = await resetPassword(token, newPassword);
      reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/api/auth/change-password', {
    preHandler: requireAuth,
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body;
      if (!currentPassword || !newPassword) {
        return reply.code(400).send({ error: 'Current password and new password are required' });
      }
      const result = await changePassword(request.user.id, currentPassword, newPassword);
      reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/api/auth/logout', {
    schema: logoutSchema,
    preHandler: requireAuth,
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body || {};
      const result = await logout(request.user.id, refreshToken);
      reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/api/auth/logout-all', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const result = await logoutAll(request.user.id);
      reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });
}

export default authRoutes;
