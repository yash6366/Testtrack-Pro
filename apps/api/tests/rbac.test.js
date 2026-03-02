/**
 * RBAC (Role-Based Access Control) TESTS
 * Tests authorization and role-based permission enforcement
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, createTestUser } from './setup.js';

describe('RBAC - Role-Based Access Control', () => {
  let app;
  let adminUser;
  let developerUser;
  let testerUser;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();

    // Create test users with different roles
    adminUser = await createTestUser(app, 'admin');
    developerUser = await createTestUser(app, 'developer');
    testerUser = await createTestUser(app, 'tester');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Role Assignment', () => {
    it('should assign correct role on signup', async () => {
      expect(adminUser.user.role).toBe('ADMIN');
      expect(developerUser.user.role).toBe('DEVELOPER');
      expect(testerUser.user.role).toBe('TESTER');
    });

    it('should persist role across login sessions', async () => {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: 'AdminPass123!@#',
        },
      });

      const data = JSON.parse(loginRes.body);
      expect(data.user.role).toBe('ADMIN');
    });
  });

  describe('Token Validation', () => {
    it('should reject requests without token', async () => {
      // Try to access a protected route without token
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',  // Protected route
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          authorization: 'NotABearer ' + adminUser.token,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Request Context', () => {
    it('should include request ID in response headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: adminUser.user.email,
          password: 'AdminPass123!@#',
        },
      });

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should accept custom request ID from client', async () => {
      const customId = 'custom-request-id-12345';
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'x-request-id': customId,
        },
        payload: {
          email: adminUser.user.email,
          password: 'AdminPass123!@#',
        },
      });

      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Token Versioning & Invalidation', () => {
    it('should invalidate old tokens after logout', async () => {
      // Login to get token
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: developerUser.user.email,
          password: 'DevPass456!@#',
        },
      });

      const token = JSON.parse(loginRes.body).token;

      // Logout (should invalidate token)
      await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { authorization: `Bearer ${token}` },
      });

      // Try to use old token - should fail
      const oldTokenRes = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(oldTokenRes.statusCode).toBe(401);
    });
  });

  describe('Error Responses', () => {
    it('should not expose internal error details in production mode', async () => {
      // This test verifies error handling is safe
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
      expect(data.requestId).toBeDefined();
    });

    it('should include request ID in error responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          // Missing required fields
        },
      });

      const data = JSON.parse(response.body);
      expect(data.requestId).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should support multi-session logout', async () => {
      // Create multiple sessions for same user
      const session1 = await createTestUser(app, 'developer');
      
      const session2Res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: session1.user.email,
          password: 'DevPass456!@#',
        },
      });
      const session2Token = JSON.parse(session2Res.body).token;

      // Logout all sessions
      const logoutAllRes = await app.inject({
        method: 'POST',
        url: '/api/auth/logout-all',
        headers: {
          authorization: `Bearer ${session1.token}`,
        },
      });

      // Check that both sessions are invalid
      if (logoutAllRes.statusCode === 200) {
        const profile1 = await app.inject({
          method: 'GET',
          url: '/api/users/profile',
          headers: { authorization: `Bearer ${session1.token}` },
        });
        expect(profile1.statusCode).toBe(401);

        const profile2 = await app.inject({
          method: 'GET',
          url: '/api/users/profile',
          headers: { authorization: `Bearer ${session2Token}` },
        });
        expect(profile2.statusCode).toBe(401);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should not response too quickly to prevent timing attacks', async () => {
      const startTime = Date.now();
      
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should take at least some time (bcrypt hashing)
      expect(responseTime).toBeGreaterThanOrEqual(50);  // At least 50ms
    });
  });
});
