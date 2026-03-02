/**
 * TEST SETUP & HELPERS
 * Provides common utilities for all tests
 */

import Fastify from 'fastify';
import { setupCors } from '../src/plugins/cors.js';
import { setupJwt } from '../src/plugins/jwt.js';
import { setupHelmet } from '../src/plugins/helmet.js';
import { errorHandlerPlugin } from '../src/plugins/errorHandler.js';
import { requestContextPlugin } from '../src/plugins/requestContext.js';
import { rateLimitPlugin } from '../src/plugins/rateLimit.js';
import { initializeLogger } from '../src/lib/logger.js';
import authRoutes from '../src/routes/auth.js';

/**
 * Create a test Fastify instance with minimal setup
 * Use this for API route testing
 */
export async function buildTestApp() {
  const fastify = Fastify({
    logger: process.env.DEBUG_TESTS ? true : false,
  });

  // Initialize logger with test fastify instance
  initializeLogger(fastify.log);

  // Register error handling & context plugins FIRST
  await fastify.register(errorHandlerPlugin);
  await fastify.register(requestContextPlugin);

  // Register auth & security plugins
  await setupCors(fastify);
  await setupJwt(fastify);
  await setupHelmet(fastify);

  // Only register auth routes for now (expand as needed)
  fastify.register(authRoutes);

  return fastify;
}

/**
 * Test user fixtures
 */
export const testUsers = {
  admin: {
    name: 'Test Admin',
    email: 'admin@test.example.com',
    password: 'AdminPass123!@#',
    role: 'ADMIN',
  },
  developer: {
    name: 'Test Developer',
    email: 'developer@test.example.com',
    password: 'DevPass456!@#',
    role: 'DEVELOPER',
  },
  tester: {
    name: 'Test Tester',
    email: 'tester@test.example.com',
    password: 'TesterPass789!@#',
    role: 'TESTER',
  },
};

/**
 * Helper to create test user and return auth token
 */
export async function createTestUser(app, userType = 'developer') {
  const user = testUsers[userType];
  
  const signupRes = await app.inject({
    method: 'POST',
    url: '/api/auth/signup',
    payload: user,
  });

  if (signupRes.statusCode !== 201) {
    throw new Error(`Failed to create test user: ${signupRes.body}`);
  }

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: user.email,
      password: user.password,
    },
  });

  if (loginRes.statusCode !== 200) {
    throw new Error('Failed to login test user');
  }

  const body = JSON.parse(loginRes.body);
  return {
    user: body.user,
    token: body.token,
    refreshToken: body.refreshToken,
  };
}

/**
 * Make authenticated request
 */
export async function makeAuthRequest(app, method, path, payload, token) {
  return app.inject({
    method,
    url: path,
    payload,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Assert response status code
 */
export function assertStatus(response, expectedStatus, message) {
  if (response.statusCode !== expectedStatus) {
    console.error(`Expected ${expectedStatus}, got ${response.statusCode}`);
    console.error('Response body:', response.body);
    throw new Error(message || `Expected status ${expectedStatus}, got ${response.statusCode}`);
  }
}

/**
 * Parse response JSON
 */
export function parseResponse(response) {
  try {
    return JSON.parse(response.body);
  } catch (error) {
    throw new Error(`Failed to parse response: ${response.body}`);
  }
}
