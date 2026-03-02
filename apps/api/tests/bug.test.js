/**
 * BUG SERVICE TESTS
 * Tests for bug creation, updates, and business logic
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, createTestUser, parseResponse } from './setup.js';
import { getPrismaClient } from '../src/lib/prisma.js';

describe('Bug Service', () => {
  let app;
  let testerUser;
  let projectId;
  const prisma = getPrismaClient();

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    
    // Create test user (tester role)
    testerUser = await createTestUser(app, 'tester');
    
    // Create test project
    const projectRes = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${testerUser.token}` },
      payload: {
        name: 'Test Project',
        description: 'For testing bug service',
      },
    });
    
    const projectData = parseResponse(projectRes);
    projectId = projectData.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Bug Creation', () => {
    it('should create bug with valid data', async () => {
      const bugData = {
        title: 'Login button not working',
        description: 'The login button on the home page is not responding to clicks',
        priority: 'P1',
        severity: 'HIGH',
        environment: 'PROD',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/bugs`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: bugData,
      });

      expect(response.statusCode).toBe(201);
      const data = parseResponse(response);
      expect(data.id).toBeDefined();
      expect(data.title).toBe(bugData.title);
      expect(data.reportedById).toBe(testerUser.user.id);
    });

    it('should reject bug with missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/bugs`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: {
          title: 'Missing description',
          // Missing required description
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should sanitize HTML in bug description', async () => {
      const bugData = {
        title: 'XSS Test',
        description: 'This should <script>alert("xss")</script> be escaped',
        priority: 'P3',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/bugs`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: bugData,
      });

      expect(response.statusCode).toBe(201);
      const data = parseResponse(response);
      // Verify HTML is escaped
      expect(data.description).not.toContain('<script>');
      expect(data.description).toContain('&lt;script');
    });
  });

  describe('Bug Status Transitions', () => {
    let bugId;

    beforeAll(async () => {
      // Create a bug for status testing
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/bugs`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: {
          title: 'Status test bug',
          description: 'For testing status transitions',
          priority: 'P2',
        },
      });
      bugId = parseResponse(response).id;
    });

    it('should change status from OPEN to IN_PROGRESS', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${projectId}/bugs/${bugId}`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: { status: 'IN_PROGRESS' },
      });

      expect(response.statusCode).toBe(200);
      const data = parseResponse(response);
      expect(data.status).toBe('IN_PROGRESS');
    });

    it('should prevent invalid status transitions', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${projectId}/bugs/${bugId}`,
        headers: { authorization: `Bearer ${testerUser.token}` },
        payload: { status: 'INVALID_STATUS' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Bug Pagination', () => {
    it('should list bugs with pagination', async () => {
      // Create multiple bugs
      for (let i = 0; i < 25; i++) {
        await app.inject({
          method: 'POST',
          url: `/api/projects/${projectId}/bugs`,
          headers: { authorization: `Bearer ${testerUser.token}` },
          payload: {
            title: `Bug ${i + 1}`,
            description: `Description for bug ${i + 1}`,
            priority: 'P3',
          },
        });
      }

      // Fetch with pagination
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/bugs?skip=0&take=10`,
        headers: { authorization: `Bearer ${testerUser.token}` },
      });

      expect(response.statusCode).toBe(200);
      const data = parseResponse(response);
      expect(data.data.length).toBeLessThanOrEqual(10);
      expect(data.pagination.take).toBe(10);
      expect(data.pagination.hasMore).toBeDefined();
    });

    it('should respect maximum page size limit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/bugs?skip=0&take=1000`,
        headers: { authorization: `Bearer ${testerUser.token}` },
      });

      expect(response.statusCode).toBe(200);
      const data = parseResponse(response);
      // Max page size should be enforced (e.g., 100)
      expect(data.pagination.take).toBeLessThanOrEqual(100);
    });
  });
});
