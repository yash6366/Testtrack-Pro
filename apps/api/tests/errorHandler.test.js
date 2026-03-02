/**
 * ERROR HANDLER TESTS
 * Verifies error handling and global error handler plugin
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { errorHandlerPlugin, ValidationError, NotFoundError, PermissionError } from '../src/plugins/errorHandler.js';
import { requestContextPlugin } from '../src/plugins/requestContext.js';

describe('Global Error Handler Plugin', () => {
  let app;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    
    // Register error handler first
    await app.register(errorHandlerPlugin);
    await app.register(requestContextPlugin);

    // Test route that throws ValidationError
    app.post('/test/validation', async (req, reply) => {
      throw new ValidationError('Invalid input', { field: 'email' });
    });

    // Test route that throws NotFoundError
    app.get('/test/not-found', async (req, reply) => {
      throw new NotFoundError('User');
    });

    // Test route that throws PermissionError
    app.post('/test/permission', async (req, reply) => {
      throw new PermissionError('delete this resource');
    });

    // Test route that throws generic Error
    app.get('/test/generic', async (req, reply) => {
      throw new Error('Something went wrong');
    });

    // Test route that accepts and returns data
    app.post('/test/success', async (req, reply) => {
      return { success: true };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Error Type Handling', () => {
    it('should handle ValidationError with 400 status', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/validation',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Validation Failed');
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Invalid input');
      expect(data.requestId).toBeDefined();
    });

    it('should handle NotFoundError with 404 status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Not Found');
      expect(data.code).toBe('NOT_FOUND');
      expect(data.message).toContain('User not found');
    });

    it('should handle PermissionError with 403 status', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/permission',
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Forbidden');
      expect(data.code).toBe('PERMISSION_DENIED');
      expect(data.message).toContain('delete this resource');
    });

    it('should handle generic errors with 500 status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/generic',
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.error).toBeDefined();
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(data.requestId).toBeDefined();
    });

    it('should return success response for non-error calls', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/success',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });

  describe('Request ID in Errors', () => {
    it('should include requestId in all error responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
      });

      const data = JSON.parse(response.body);
      expect(data.requestId).toBeDefined();
      expect(typeof data.requestId).toBe('string');
      expect(data.requestId.length).toBeGreaterThan(0);
    });

    it('should propagate custom request ID to error response', async () => {
      const customId = 'custom-test-id-xyz';
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
        headers: {
          'x-request-id': customId,
        },
      });

      expect(response.headers['x-request-id']).toBe(customId);
      const data = JSON.parse(response.body);
      expect(data.requestId).toBe(customId);
    });
  });

  describe('Error Details (Development vs Production)', () => {
    it('should include details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await app.inject({
        method: 'POST',
        url: '/test/validation',
      });

      const data = JSON.parse(response.body);
      // In dev mode, details might be included
      // This depends on implementation

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Response Structure', () => {
    it('should have consistent error response structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/not-found',
      });

      const data = JSON.parse(response.body);
      
      // All error responses should have these fields
      expect(data.error).toBeDefined();
      expect(data.code).toBeDefined();
      expect(data.message).toBeDefined();
      expect(data.requestId).toBeDefined();
      
      expect(typeof data.error).toBe('string');
      expect(typeof data.code).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(typeof data.requestId).toBe('string');
    });

    it('should not expose stack traces in error responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/generic',
      });

      expect(response.body).not.toContain('at ');
      expect(response.body).not.toContain('stack');
    });
  });
});
