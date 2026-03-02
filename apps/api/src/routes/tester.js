/**
 * TESTER ROLE ROUTES
 * Tester-specific dashboard, metrics, and workflows
 */

import { getPrismaClient } from '../lib/prisma.js';
import { createAuthGuards } from '../lib/rbac.js';
import { requirePermission } from '../lib/policy.js';
import { logError, logInfo } from '../lib/logger.js';
import { logAuditAction } from '../services/auditService.js';
import {
  generateExecutionReport,
  generateTesterPerformanceReport,
  exportTestRunToCSV,
  getProjectTestMetrics,
} from '../services/reportService.js';
import {
  generateExecutionPDF,
  generateExecutionExcel,
  generateTesterPerformancePDF,
} from '../services/exportService.js';
import {
  createTestCase,
  updateTestCase,
  assignTestCase,
  setTestCaseOwner,
  getUserAssignedTestCases,
  getUserOwnedTestCases,
  importTestCasesFromCSV,
} from '../services/testCaseService.js';
import {
  createTestCaseTemplate,
  updateTestCaseTemplate,
  deleteTestCaseTemplate,
  getProjectTemplates,
  getTemplateById,
  createTestCaseFromTemplate,
} from '../services/testCaseTemplateService.js';
import {
  getProjectBugs,
} from '../services/bugService.js';

const prisma = getPrismaClient();

export async function testerRoutes(fastify) {
  const { requireAuth, requireRoles } = createAuthGuards(fastify);

  function getClientContext(request) {
    return {
      ipAddress: request.ip || request.socket?.remoteAddress || null,
      userAgent: request.headers['user-agent'] || null,
    };
  }

  // ============================================
  // PROJECT ACCESS
  // ============================================

  /**
   * Get projects allocated to the tester
   */
  fastify.get(
    '/api/tester/projects',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { skip = 0, take = 50, search } = request.query;

        // Build where clause
        const where = {
          status: 'ACTIVE',
          userAllocations: {
            some: {
              userId,
              isActive: true,
            },
          },
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { key: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [projects, total] = await Promise.all([
          prisma.project.findMany({
            where,
            select: {
              id: true,
              name: true,
              key: true,
              description: true,
              createdAt: true,
              userAllocations: {
                where: {
                  userId,
                  isActive: true,
                },
                select: {
                  projectRole: true,
                  allocatedAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: Math.max(0, Number(skip)),
            take: Math.min(100, Math.max(1, Number(take))),
          }),
          prisma.project.count({ where }),
        ]);

        // Format the response
        const formattedProjects = projects.map((project) => ({
          id: project.id,
          name: project.name,
          key: project.key,
          description: project.description,
          modules: [],
          createdAt: project.createdAt,
          myRole: project.userAllocations[0]?.projectRole || null,
          joinedAt: project.userAllocations[0]?.allocatedAt || null,
        }));

        reply.send({
          projects: formattedProjects,
          pagination: {
            skip: Number(skip),
            take: Number(take),
            total,
          },
        });
      } catch (error) {
        logError('Error fetching tester projects:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // ============================================
  // TEST CASE MANAGEMENT (TESTER DASHBOARD)
  // ============================================

  /**
   * Get test cases assigned to user
   */
  fastify.get(
    '/api/tester/test-cases/assigned',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const filters = {
          projectId: request.query.projectId ? Number(request.query.projectId) : null,
          status: request.query.status,
          skip: request.query.skip ? Number(request.query.skip) : 0,
          take: request.query.take ? Number(request.query.take) : 50,
        };

        const result = await getUserAssignedTestCases(userId, filters);
        reply.send(result);
      } catch (error) {
        logError('Error fetching assigned test cases:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get test cases owned by user
   */
  fastify.get(
    '/api/tester/test-cases/owned',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const filters = {
          projectId: request.query.projectId ? Number(request.query.projectId) : null,
          status: request.query.status,
          skip: request.query.skip ? Number(request.query.skip) : 0,
          take: request.query.take ? Number(request.query.take) : 50,
        };

        const result = await getUserOwnedTestCases(userId, filters);
        reply.send(result);
      } catch (error) {
        logError('Error fetching owned test cases:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Create test case with all fields
   */
  fastify.post(
    '/api/tester/projects/:projectId/test-cases',
    { preHandler: [requirePermission('testCase:create')] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;
        const userId = request.user.id;

        const testCase = await createTestCase(
          {
            ...request.body,
            projectId: Number(projectId),
            ownedById: userId, // Owner is the creator
          },
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.code(201).send(testCase);
      } catch (error) {
        logError('Error creating test case:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Update test case (can update if owner or assigned)
   */
  fastify.patch(
    '/api/tester/test-cases/:testCaseId',
    { preHandler: [requirePermission('testCase:edit')] },
    async (request, reply) => {
      try {
        const { testCaseId } = request.params;
        const userId = request.user.id;

        // Check authorization - fetch with project to validate access
        const testCase = await prisma.testCase.findUnique({
          where: { id: Number(testCaseId) },
          include: {
            project: {
              include: {
                userAllocations: {
                  where: { userId, isActive: true },
                },
              },
            },
          },
        });

        if (!testCase) {
          return reply.code(404).send({ error: 'Test case not found' });
        }

        // Verify user has access to the project
        if (!testCase.project?.userAllocations?.length) {
          return reply.code(403).send({ error: 'Not authorized to access this project' });
        }

        // Check if user is owner or assigned to test case
        if (testCase.ownedById !== userId && testCase.assignedToId !== userId) {
          return reply.code(403).send({ error: 'Not authorized to update this test case' });
        }

        const updated = await updateTestCase(
          Number(testCaseId),
          request.body,
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.send(updated);
      } catch (error) {
        logError('Error updating test case:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Assign test case to user
   */
  fastify.patch(
    '/api/tester/test-cases/:testCaseId/assign',
    { preHandler: [requirePermission('testCase:assign')] },
    async (request, reply) => {
      try {
        const { testCaseId } = request.params;
        const { assignedToId } = request.body;
        const userId = request.user.id;

        if (!assignedToId) {
          return reply.code(400).send({ error: 'assignedToId is required' });
        }

        const updated = await assignTestCase(
          Number(testCaseId),
          assignedToId,
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.send(updated);
      } catch (error) {
        logError('Error assigning test case:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Set test case owner
   */
  fastify.patch(
    '/api/tester/test-cases/:testCaseId/owner',
    { preHandler: [requirePermission('testCase:assign')] },
    async (request, reply) => {
      try {
        const { testCaseId } = request.params;
        const { ownedById } = request.body;
        const userId = request.user.id;

        if (!ownedById) {
          return reply.code(400).send({ error: 'ownedById is required' });
        }

        // Fetch with project to validate access
        const testCase = await prisma.testCase.findUnique({
          where: { id: Number(testCaseId) },
          include: {
            project: {
              include: {
                userAllocations: {
                  where: { userId, isActive: true },
                },
              },
            },
          },
        });

        if (!testCase) {
          return reply.code(404).send({ error: 'Test case not found' });
        }

        // Verify user has access to the project
        if (!testCase.project?.userAllocations?.length) {
          return reply.code(403).send({ error: 'Not authorized to access this project' });
        }

        // Only owner can change ownership
        if (testCase.ownedById !== userId) {
          return reply.code(403).send({ error: 'Only test case owner can change ownership' });
        }

        const updated = await setTestCaseOwner(
          Number(testCaseId),
          ownedById,
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.send(updated);
      } catch (error) {
        logError('Error setting test case owner:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Import test cases from CSV
   */
  fastify.post(
    '/api/tester/projects/:projectId/test-cases/import',
    { preHandler: [requirePermission('testCase:import')] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;
        const { csvContent } = request.body;
        const userId = request.user.id;

        if (!csvContent) {
          return reply.code(400).send({ error: 'csvContent is required' });
        }

        const results = await importTestCasesFromCSV(
          Number(projectId),
          csvContent,
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.code(201).send(results);
      } catch (error) {
        logError('Error importing test cases:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // ============================================
  // TEST CASE TEMPLATES (TESTER DASHBOARD)
  // ============================================

  /**
   * Get project templates
   */
  fastify.get(
    '/api/tester/projects/:projectId/templates',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;
        const filters = {
          category: request.query.category,
          isActive: request.query.isActive !== 'false',
          skip: request.query.skip ? Number(request.query.skip) : 0,
          take: request.query.take ? Number(request.query.take) : 50,
        };

        const result = await getProjectTemplates(Number(projectId), filters);
        reply
          .header('Content-Type', 'application/json')
          .send(result);
      } catch (error) {
        logError('Error fetching templates:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get single template
   */
  fastify.get(
    '/api/tester/templates/:templateId',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const { templateId } = request.params;
        const template = await getTemplateById(Number(templateId));
        reply.send(template);
      } catch (error) {
        logError('Error fetching template:', error);
        reply.code(404).send({ error: error.message });
      }
    },
  );

  /**
   * Create test case from template
   */
  fastify.post(
    '/api/tester/templates/:templateId/create-test-case',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const { templateId } = request.params;
        const { projectId, testCaseName } = request.body;
        const userId = request.user.id;

        if (!projectId || !testCaseName) {
          return reply.code(400).send({
            error: 'projectId and testCaseName are required',
          });
        }

        const testCase = await createTestCaseFromTemplate(
          Number(templateId),
          Number(projectId),
          testCaseName,
          userId,
          getClientContext(request),
        );

        reply.code(201).send(testCase);
      } catch (error) {
        logError('Error creating test case from template:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Create template
   */
  fastify.post(
    '/api/tester/projects/:projectId/templates',
    { preHandler: [requirePermission('testPlan:create')] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;
        const userId = request.user.id;

        const template = await createTestCaseTemplate(
          {
            ...request.body,
            projectId: Number(projectId),
          },
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.code(201).send(template);
      } catch (error) {
        logError('Error creating template:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Update template
   */
  fastify.patch(
    '/api/tester/templates/:templateId',
    { preHandler: [requirePermission('testPlan:edit')] },
    async (request, reply) => {
      try {
        const { templateId } = request.params;
        const userId = request.user.id;

        const updated = await updateTestCaseTemplate(
          Number(templateId),
          request.body,
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.send(updated);
      } catch (error) {
        logError('Error updating template:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Delete template
   */
  fastify.delete(
    '/api/tester/templates/:templateId',
    { preHandler: [requirePermission('testPlan:delete')] },
    async (request, reply) => {
      try {
        const { templateId } = request.params;
        const userId = request.user.id;

        await deleteTestCaseTemplate(
          Number(templateId),
          userId,
          getClientContext(request),
          request.permissionContext,
        );

        reply.code(204).send();
      } catch (error) {
        logError('Error deleting template:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // ============================================
  // TESTER DASHBOARD & METRICS
  // ============================================

  /**
   * Get tester overview (dashboard metrics)
   */
  fastify.get(
    '/api/tester/overview',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request) => {
      const userId = request.user.id;

      // Get test execution statistics
      const [
        totalExecutions,
        passedExecutions,
        failedExecutions,
        blockedExecutions,
        testCasesCreated,
        activeBugs,
        recentExecutions,
      ] = await Promise.all([
        // Total executions by this tester
        prisma.testExecution.count({
          where: { userId },
        }),

        // Passed executions
        prisma.testExecution.count({
          where: {
            userId,
            status: 'PASSED',
          },
        }),

        // Failed executions
        prisma.testExecution.count({
          where: {
            userId,
            status: 'FAILED',
          },
        }),

        // Blocked executions
        prisma.testExecution.count({
          where: {
            userId,
            status: 'BLOCKED',
          },
        }),

        // Test cases created by tester
        prisma.testCase.count({
          where: {
            createdBy: userId,
            isDeleted: false,
          },
        }),

        // Active bugs reported (using defectId as reference)
        prisma.bug.count({
          where: {
            reportedBy: userId,
            status: { in: ['OPEN', 'IN_PROGRESS', 'REOPEN'] },
          },
        }),

        // Recent 10 executions
        prisma.testExecution.findMany({
          where: { userId },
          include: {
            testCase: {
              select: {
                id: true,
                name: true,
                type: true,
                priority: true,
              },
            },
            testRun: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        }),
      ]);

      const passRate = totalExecutions > 0 
        ? ((passedExecutions / totalExecutions) * 100).toFixed(2) 
        : 0;

      return {
        userId,
        metrics: {
          totalExecutions,
          passedExecutions,
          failedExecutions,
          blockedExecutions,
          testCasesCreated,
          activeBugs,
          passRate: Number(passRate),
        },
        recentExecutions,
      };
    },
  );

  /**
   * Get tester performance metrics (detailed)
   */
  fastify.get(
    '/api/tester/performance',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'ADMIN'])] },
    async (request) => {
      const userId = request.query.userId 
        ? Number(request.query.userId) 
        : request.user.id;

      // Only admins can view other testers' performance
      if (userId !== request.user.id && request.user.role !== 'ADMIN') {
        return { error: 'Unauthorized to view other tester metrics' };
      }

      // Get execution stats by status
      const executionsByStatus = await prisma.testExecution.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      });

      // Get test cases created by type
      const testCasesByType = await prisma.testCase.groupBy({
        by: ['type'],
        where: {
          createdBy: userId,
          isDeleted: false,
        },
        _count: { type: true },
      });

      // Get test cases by priority
      const testCasesByPriority = await prisma.testCase.groupBy({
        by: ['priority'],
        where: {
          createdBy: userId,
          isDeleted: false,
        },
        _count: { priority: true },
      });

      // Get average execution time (executions completed this month)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentCompletedExecutions = await prisma.testExecution.findMany({
        where: {
          userId,
          completedAt: { not: null },
          startedAt: { gte: oneMonthAgo },
        },
        select: {
          actualDurationSeconds: true,
        },
      });

      const avgExecutionTime = recentCompletedExecutions.length > 0
        ? recentCompletedExecutions.reduce((sum, e) => sum + (e.actualDurationSeconds || 0), 0) / recentCompletedExecutions.length
        : 0;

      // Get test runs participated in
      const testRuns = await prisma.testRun.findMany({
        where: {
          executions: {
            some: { userId },
          },
        },
        include: {
          executions: {
            where: { userId },
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        userId,
        executionsByStatus,
        testCasesByType,
        testCasesByPriority,
        avgExecutionTimeSeconds: Math.round(avgExecutionTime),
        testRunsParticipated: testRuns.length,
        recentTestRuns: testRuns,
      };
    },
  );

  /**
   * Get assigned test runs (for current tester)
   */
  fastify.get(
    '/api/tester/test-runs/assigned',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request) => {
      const userId = request.user.id;

      const testRuns = await prisma.testRun.findMany({
        where: {
          executedBy: userId,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          executions: {
            select: {
              id: true,
              status: true,
              testCaseId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { testRuns };
    },
  );

  /**
   * Get pending test executions
   */
  fastify.get(
    '/api/tester/executions/pending',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request) => {
      const userId = request.user.id;

      const pendingExecutions = await prisma.testExecution.findMany({
        where: {
          userId,
          status: { in: ['BLOCKED', 'INCONCLUSIVE'] }, // Not completed
        },
        include: {
          testCase: {
            select: {
              id: true,
              name: true,
              type: true,
              priority: true,
            },
          },
          testRun: {
            select: {
              id: true,
              name: true,
              environment: true,
            },
          },
          steps: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      });

      return { pendingExecutions };
    },
  );

  /**
   * Get test execution history for tester
   */
  fastify.get(
    '/api/tester/executions/history',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request) => {
      const userId = request.user.id;
      const { skip = 0, take = 20, status, projectId } = request.query;

      const where = {
        userId,
        ...(status && { status }),
        ...(projectId && {
          testRun: {
            projectId: Number(projectId),
          },
        }),
      };

      const [executions, total] = await Promise.all([
        prisma.testExecution.findMany({
          where,
          include: {
            testCase: {
              select: {
                id: true,
                name: true,
                type: true,
                priority: true,
              },
            },
            testRun: {
              select: {
                id: true,
                name: true,
                environment: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          skip: Number(skip),
          take: Number(take),
          orderBy: { startedAt: 'desc' },
        }),
        prisma.testExecution.count({ where }),
      ]);

      return {
        executions,
        total,
        skip: Number(skip),
        take: Number(take),
      };
    },
  );

  /**
   * Get bugs reported by tester
   */
  fastify.get(
    '/api/tester/bugs/reported',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { projectId, status, priority, skip, take } = request.query;

        const result = await getProjectBugs(projectId ? Number(projectId) : null, {
          reporterId: userId,
          status,
          priority,
          skip: skip ? Number(skip) : 0,
          take: take ? Number(take) : 50,
        });

        reply.send(result);
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get productivity summary (this week vs last week)
   */
  fastify.get(
    '/api/tester/productivity',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'ADMIN'])] },
    async (request) => {
      const userId = request.query.userId 
        ? Number(request.query.userId) 
        : request.user.id;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [thisWeek, lastWeek] = await Promise.all([
        prisma.testExecution.count({
          where: {
            userId,
            startedAt: { gte: weekAgo },
          },
        }),
        prisma.testExecution.count({
          where: {
            userId,
            startedAt: { gte: twoWeeksAgo, lt: weekAgo },
          },
        }),
      ]);

      const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

      return {
        thisWeek,
        lastWeek,
        changePercent: change.toFixed(2),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      };
    },
  );

  // ============================================
  // REPORTING & EXPORT
  // ============================================

  /**
   * Generate test execution report for a test run
   */
  fastify.get(
    '/api/test-runs/:runId/report',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { runId } = request.params;
        const report = await generateExecutionReport(Number(runId));
        reply.send(report);
      } catch (error) {
        logError('Error generating report:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Export test run to CSV
   */
  fastify.get(
    '/api/test-runs/:runId/export/csv',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { runId } = request.params;
        const csv = await exportTestRunToCSV(Number(runId));

        reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="test-run-${runId}.csv"`)
          .send(csv);
      } catch (error) {
        logError('Error exporting test run:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Export test run to PDF
   */
  fastify.get(
    '/api/test-runs/:runId/export/pdf',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { runId } = request.params;
        logInfo(`[PDF Export] Generating PDF for test run ${runId}...`);
        
        const pdf = await generateExecutionPDF(Number(runId));
        
        if (!pdf) {
          throw new Error('PDF generation returned empty result');
        }
        
        logInfo(`[PDF Export] PDF generated successfully, size: ${pdf.byteLength || pdf.length} bytes`);
        
        const buffer = Buffer.from(pdf);
        logInfo(`[PDF Export] Sending PDF buffer of ${buffer.length} bytes...`);

        reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="test-run-${runId}.pdf"`)
          .send(buffer);
          
        logInfo(`[PDF Export] PDF sent successfully for test run ${runId}`);
      } catch (error) {
        logError('Error exporting test run to PDF:', error);
        logError('[PDF Export] Error details:', {
          message: error.message,
          stack: error.stack,
          runId: request.params.runId
        });
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Export test run to Excel
   */
  fastify.get(
    '/api/test-runs/:runId/export/excel',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { runId } = request.params;
        const excel = await generateExecutionExcel(Number(runId));

        reply
          .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          .header('Content-Disposition', `attachment; filename="test-run-${runId}.xlsx"`)
          .send(Buffer.from(excel));
      } catch (error) {
        logError('Error exporting test run to Excel:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get tester performance report
   */
  fastify.get(
    '/api/tester/reports/performance',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const userId = request.query.userId 
          ? Number(request.query.userId) 
          : request.user.id;

        // Only admins can view other tester reports
        if (userId !== request.user.id && request.user.role !== 'ADMIN') {
          return reply.code(403).send({ error: 'Unauthorized' });
        }

        const options = {
          startDate: request.query.startDate,
          endDate: request.query.endDate,
        };

        const report = await generateTesterPerformanceReport(userId, options);
        reply.send(report);
      } catch (error) {
        logError('Error generating performance report:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Export tester performance report to PDF
   */
  fastify.get(
    '/api/tester/reports/performance/pdf',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const userId = request.query.userId 
          ? Number(request.query.userId) 
          : request.user.id;

        // Only admins can view other tester reports
        if (userId !== request.user.id && request.user.role !== 'ADMIN') {
          return reply.code(403).send({ error: 'Unauthorized' });
        }

        const weeks = request.query.weeks ? Number(request.query.weeks) : 4;
        logInfo(`[PDF Export] Generating performance PDF for user ${userId}, weeks: ${weeks}...`);
        
        const pdf = await generateTesterPerformancePDF(userId, weeks);
        
        if (!pdf) {
          throw new Error('PDF generation returned empty result');
        }
        
        logInfo(`[PDF Export] Performance PDF generated successfully, size: ${pdf.byteLength || pdf.length} bytes`);
        
        const buffer = Buffer.from(pdf);

        reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="tester-performance-${userId}.pdf"`)
          .send(buffer);
          
        logInfo(`[PDF Export] Performance PDF sent successfully for user ${userId}`);
      } catch (error) {
        logError('Error exporting performance report to PDF:', error);
        logError('[PDF Export] Error details:', {
          message: error.message,
          stack: error.stack,
          userId: request.query.userId || request.user.id
        });
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get project test metrics
   */
  fastify.get(
    '/api/projects/:projectId/metrics',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;
        const metrics = await getProjectTestMetrics(Number(projectId));
        reply.send(metrics);
      } catch (error) {
        logError('Error fetching project metrics:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  // ============================================
  // ADVANCED TESTER WORKFLOWS
  // ============================================

  /**
   * Fail test execution step and create bug immediately
   * Workflow: Tester fails a step and creates a bug in one action
   */
  fastify.post(
    '/api/tester/test-executions/:executionId/steps/:stepId/fail-and-create-bug',
    { preHandler: [requirePermission('bug:create')] },
    async (request, reply) => {
      try {
        const { executionId, stepId } = request.params;
        const userId = request.user.id;
        const {
          bugTitle,
          bugDescription,
          environment,
          priority = 'P2',
          severity = 'MINOR',
          stepsToReproduce,
          expectedBehavior,
          actualBehavior,
        } = request.body;

        // Validate required fields
        if (!bugTitle || !bugDescription) {
          return reply.code(400).send({
            error: 'bugTitle and bugDescription are required',
          });
        }

        if (!environment) {
          return reply.code(400).send({
            error: 'environment is required (DEVELOPMENT, STAGING, UAT, PRODUCTION)',
          });
        }

        // Get execution and step details
        const execution = await prisma.testExecution.findUnique({
          where: { id: Number(executionId) },
          include: {
            testCase: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
            testRun: {
              select: {
                projectId: true,
              },
            },
          },
        });

        if (!execution) {
          return reply.code(404).send({ error: 'Execution not found' });
        }

        const projectId = execution.testRun.projectId;

        // Verify user has access to the project
        const projectAccess = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            userAllocations: {
              where: { userId, isActive: true },
            },
          },
        });

        if (!projectAccess?.userAllocations?.length) {
          return reply.code(403).send({ error: 'Not authorized to access this project' });
        }

        // Update step status to FAILED
        await prisma.testExecutionStep.update({
          where: {
            executionId_stepId: {
              executionId: Number(executionId),
              stepId: Number(stepId),
            },
          },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
          },
        });

        // Create the bug
        const bug = await prisma.bug.create({
          data: {
            projectId,
            bugNumber: '', // Will be set after we generate it
            title: bugTitle,
            description: bugDescription,
            environment,
            priority,
            severity,
            status: 'NEW',
            reportedBy: userId,
            testCaseId: execution.testCase.id,
            executionId: Number(executionId),
            stepsToReproduce: stepsToReproduce || null,
            expectedBehavior: expectedBehavior || null,
            actualBehavior: actualBehavior || null,
          },
        });

        // Generate unique bug number
        const counter = await prisma.bugCounter.upsert({
          where: { projectId },
          create: { projectId, nextNumber: 1 },
          update: { nextNumber: { increment: 1 } },
        });

        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { key: true },
        });

        const bugNumber = `${project.key}-${counter.nextNumber.toString().padStart(3, '0')}`;

        // Update bug with generated number
        const updatedBug = await prisma.bug.update({
          where: { id: bug.id },
          data: { bugNumber },
          include: {
            reporter: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            testCase: { select: { id: true, name: true } },
            execution: { select: { id: true, status: true } },
          },
        });

        // Log audit
        await logAuditAction(userId, 'BUG_CREATED_FROM_FAILED_TEST', {
          resourceType: 'BUG',
          resourceId: updatedBug.id,
          resourceName: bugNumber,
          projectId,
          description: `Bug created from failed test step: ${updatedBug.title}`,
          metadata: { executionId, stepId, testCaseId: execution.testCase.id },
        });

        reply.code(201).send({
          success: true,
          message: 'Step marked as FAILED and bug created',
          bug: updatedBug,
          stepUpdateConfirmation: {
            executionId,
            stepId,
            status: 'FAILED',
          },
        });
      } catch (error) {
        logError('Error failing step and creating bug:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Verify a bug fix (tester marks bug as verified after retesting)
   */
  fastify.post(
    '/api/tester/projects/:projectId/bugs/:bugId/verify',
    { preHandler: [requirePermission('bug:verify')] },
    async (request, reply) => {
      try {
        const { projectId, bugId } = request.params;
        const userId = request.user.id;
        const { testExecutionId, notes } = request.body;

        // Get bug
        const bug = await prisma.bug.findUnique({
          where: { id: Number(bugId) },
          include: {
            testCase: { select: { id: true, name: true } },
            execution: { select: { id: true, status: true } },
          },
        });

        if (!bug) {
          return reply.code(404).send({ error: 'Bug not found' });
        }

        if (Number(bug.projectId) !== Number(projectId)) {
          return reply.code(403).send({ error: 'Bug not in this project' });
        }

        if (!['FIXED', 'REOPENED'].includes(bug.status)) {
          return reply.code(400).send({
            error: `Bug must be in FIXED or REOPENED status to verify (current: ${bug.status})`,
          });
        }

        // Update bug status to VERIFIED
        const verifiedBug = await prisma.bug.update({
          where: { id: Number(bugId) },
          data: {
            status: 'VERIFIED',
            verifiedBy: userId,
            verifiedAt: new Date(),
          },
          include: {
            reporter: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            verifier: { select: { id: true, name: true, email: true } },
            testCase: { select: { id: true, name: true } },
          },
        });

        // Log history
        await prisma.bugHistory.create({
          data: {
            bugId: Number(bugId),
            changedBy: userId,
            fieldName: 'status',
            oldValue: bug.status,
            newValue: 'VERIFIED',
            changeNote: notes || 'Bug verified by tester',
          },
        });

        // Log audit
        await logAuditAction(userId, 'BUG_VERIFIED', {
          resourceType: 'BUG',
          resourceId: Number(bugId),
          resourceName: bug.bugNumber,
          projectId: Number(projectId),
          description: `Bug marked as VERIFIED: ${bug.title}`,
          metadata: { testExecutionId },
        });

        reply.send({
          success: true,
          message: 'Bug verified successfully',
          bug: verifiedBug,
        });
      } catch (error) {
        logError('Error verifying bug:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Request bug retest (tester asks for retest after developer fix)
   */
  fastify.post(
    '/api/tester/projects/:projectId/bugs/:bugId/retest-request',
    { preHandler: [requireAuth, requireRoles(['TESTER'])] },
    async (request, reply) => {
      try {
        const { projectId, bugId } = request.params;
        const userId = request.user.id;
        const { reason } = request.body;

        // Get bug
        const bug = await prisma.bug.findUnique({
          where: { id: Number(bugId) },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        });

        if (!bug) {
          return reply.code(404).send({ error: 'Bug not found' });
        }

        if (Number(bug.projectId) !== Number(projectId)) {
          return reply.code(403).send({ error: 'Bug not in this project' });
        }

        if (bug.status !== 'FIXED') {
          return reply.code(400).send({
            error: `Bug must be in FIXED status to request retest (current: ${bug.status})`,
          });
        }

        // Create retest request
        const retestRequest = await prisma.bugRetestRequest.create({
          data: {
            bugId: Number(bugId),
            reason: reason || null,
            status: 'PENDING',
          },
        });

        // Log audit
        await logAuditAction(userId, 'BUG_RETEST_REQUESTED', {
          resourceType: 'BUG',
          resourceId: Number(bugId),
          resourceName: bug.bugNumber,
          projectId: Number(projectId),
          description: `Retest requested for bug: ${bug.title}`,
          metadata: { reason },
        });

        reply.code(201).send({
          success: true,
          message: 'Retest request created successfully',
          retestRequest,
          bugNumber: bug.bugNumber,
        });
      } catch (error) {
        logError('Error requesting bug retest:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get test suite execution metrics and analytics
   */
  fastify.get(
    '/api/tester/test-suites/:suiteId/metrics',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { suiteId } = request.params;

        // Get suite details
        const suite = await prisma.testSuite.findUnique({
          where: { id: Number(suiteId) },
          include: {
            testCases: {
              select: {
                testCaseId: true,
              },
            },
          },
        });

        if (!suite) {
          return reply.code(404).send({ error: 'Test suite not found' });
        }

        const testCaseIds = suite.testCases.map((tc) => tc.testCaseId);

        // Get execution metrics
        const suiteRuns = await prisma.testSuiteRun.findMany({
          where: { suiteId: Number(suiteId) },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        // Calculate metrics
        const totalRuns = suiteRuns.length;
        const passedRuns = suiteRuns.filter((r) => r.status === 'PASSED').length;
        const failedRuns = suiteRuns.filter((r) => r.status === 'FAILED').length;
        const passRate = totalRuns > 0 ? ((passedRuns / totalRuns) * 100).toFixed(2) : 0;

        // Average execution time
        const completedRuns = suiteRuns.filter((r) => r.completedAt);
        let avgExecutionTime = 0;
        if (completedRuns.length > 0) {
          const totalTime = completedRuns.reduce((sum, run) => {
            if (run.completedAt && run.startedAt) {
              return sum + (new Date(run.completedAt) - new Date(run.startedAt));
            }
            return sum;
          }, 0);
          avgExecutionTime = Math.round(totalTime / completedRuns.length / 1000); // seconds
        }

        // Test case statistics
        const testCaseStats = await prisma.testExecution.groupBy({
          by: ['status'],
          where: {
            testCaseId: { in: testCaseIds },
          },
          _count: { status: true },
        });

        // Recent executions
        const recentExecutions = await prisma.testExecution.findMany({
          where: {
            testCaseId: { in: testCaseIds },
          },
          include: {
            testCase: {
              select: { id: true, name: true },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        });

        reply.send({
          suite: {
            id: suite.id,
            name: suite.name,
            description: suite.description,
            totalTestCases: testCaseIds.length,
          },
          metrics: {
            totalRuns,
            passedRuns,
            failedRuns,
            passRate: Number(passRate),
            avgExecutionTimeSeconds: avgExecutionTime,
          },
          testCaseStatistics: testCaseStats,
          recentRuns: suiteRuns.slice(0, 5),
          recentExecutions,
        });
      } catch (error) {
        logError('Error fetching test suite metrics:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Export test cases to CSV
   */
  fastify.get(
    '/api/tester/projects/:projectId/test-cases/export/csv',
    { preHandler: [requireAuth, requireRoles(['TESTER', 'DEVELOPER', 'ADMIN'])] },
    async (request, reply) => {
      try {
        const { projectId } = request.params;

        // Get all test cases
        const testCases = await prisma.testCase.findMany({
          where: {
            projectId: Number(projectId),
            isDeleted: false,
          },
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            creator: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (testCases.length === 0) {
          return reply.code(404).send({ error: 'No test cases found to export' });
        }

        // Generate CSV
        const csvHeaders = [
          'Test Case ID',
          'Name',
          'Description',
          'Type',
          'Priority',
          'Severity',
          'Status',
          'Pre-conditions',
          'Post-conditions',
          'Steps',
          'Expected Results',
          'Created By',
          'Created At',
          'Tags',
        ];

        const csvRows = testCases.map((tc) => [
          tc.testCaseId || tc.id,
          `"${tc.name}"`,
          `"${tc.description || ''}"`,
          tc.type,
          tc.priority,
          tc.severity,
          tc.status,
          `"${tc.preconditions || ''}"`,
          `"${tc.postconditions || ''}"`,
          `"${tc.steps
            .map((s) => `Step ${s.stepNumber}: ${s.action}`)
            .join(' | ')}"`,
          `"${tc.steps
            .map((s) => `Step ${s.stepNumber}: ${s.expectedResult}`)
            .join(' | ')}"`,
          tc.creator.name,
          new Date(tc.createdAt).toISOString(),
          tc.tags.join('; '),
        ]);

        const csv = [
          csvHeaders.join(','),
          ...csvRows.map((row) => row.join(',')),
        ].join('\n');

        reply
          .header('Content-Type', 'text/csv')
          .header(
            'Content-Disposition',
            `attachment; filename="test-cases-${projectId}-${Date.now()}.csv"`,
          )
          .send(csv);
      } catch (error) {
        logError('Error exporting test cases:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );
}

export default testerRoutes;
