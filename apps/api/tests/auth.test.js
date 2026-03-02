/**
 * AUTHENTICATION ROUTE TESTS
 * Tests for /api/auth endpoints - critical security path
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, testUsers, createTestUser, parseResponse, assertStatus } from './setup.js';

describe('Authentication Routes', () => {
  let app;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/signup', () => {
    it('should create user with valid credentials', async () => {
      const newUser = {
        name: 'John Doe',
        email: `user-${Date.now()}@test.example.com`,
        password: 'SecurePass123!@#',
        role: 'DEVELOPER',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: newUser,
      });

      assertStatus(response, 201, 'User should be created');
      const data = parseResponse(response);
      
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe(newUser.email);
      expect(data.user.role).toBe('DEVELOPER');
      expect(data.message).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: `duplicate-${Date.now()}@test.example.com`,
        password: 'SecurePass123!@#',
      };

      // Create first user
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: userData,
      });
      expect(res1.statusCode).toBe(201);

      // Try to create duplicate
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: userData,
      });
      assertStatus(res2, 400, 'Should reject duplicate email');
      const data = parseResponse(res2);
      expect(data.error).toBeDefined();
    });

    it('should reject weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          name: 'Test User',
          email: `weak-pass-${Date.now()}@test.example.com`,
          password: 'weak',  // Too short
        },
      });

      assertStatus(response, 400, 'Should reject weak password');
      const data = parseResponse(response);
      expect(data.error).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          name: 'Test User',
          // missing email and password
        },
      });

      assertStatus(response, 400, 'Should reject missing fields');
    });

    it('should reject invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          name: 'Test User',
          email: 'not-an-email',
          password: 'ValidPass123!@#',
        },
      });

      assertStatus(response, 400, 'Should reject invalid email');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeAll(async () => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        email: `login-${Date.now()}@test.example.com`,
        password: 'LoginPass123!@#',
      };

      await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: userData,
      });

      testUser = userData;
    });

    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      assertStatus(response, 200, 'Should login successfully');
      const data = parseResponse(response);
      
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
    });

    it('should reject invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: 'wrongpassword',
        },
      });

      assertStatus(response, 401, 'Should reject invalid password');
    });

    it('should reject nonexistent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@test.example.com',
          password: 'SomePass123!@#',
        },
      });

      assertStatus(response, 401, 'Should reject nonexistent user');
    });

    it('should handle remember me option', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        },
      });

      assertStatus(response, 200, 'Should support remember me');
      const data = parseResponse(response);
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout with valid token', async () => {
      // Create and login a user
      const user = await createTestUser(app, 'developer');

      // Logout
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${user.token}`,
        },
      });

      assertStatus(response, 200, 'Should logout successfully');
    });

    it('should reject logout without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      });

      assertStatus(response, 401, 'Should reject logout without token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Create and login a user
      const user = await createTestUser(app, 'developer');

      // Refresh
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: user.refreshToken,
        },
      });

      assertStatus(response, 200, 'Should refresh token successfully');
      const data = parseResponse(response);
      expect(data.token).toBeDefined();
      expect(data.token).not.toBe(user.token);  // Should be different token
      expect(data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      assertStatus(response, 401, 'Should reject invalid refresh token');
    });
  });

  describe('Security Considerations', () => {
    it('should not expose sensitive user data in responses', async () => {
      const user = await createTestUser(app, 'developer');
      const data = parseResponse(
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: user.user.email,
            password: testUsers.developer.password,
          },
        })
      );

      // Check sensitive data not exposed
      expect(data.user.password).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.user.passwordHistory).toBeUndefined();
      expect(data.user.verificationToken).toBeUndefined();
    });

    it('should not expose password in error messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'MySecretPassword123!@#',
        },
      });

      expect(response.body).not.toContain('MySecretPassword123!@#');
    });
  });
});
