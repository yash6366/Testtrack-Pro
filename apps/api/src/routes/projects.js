/**
 * PROJECT ROUTES
 * Project-level statistics and overview for team members
 */

import { createAuthGuards } from '../lib/rbac.js';
import { getPrismaClient } from '../lib/prisma.js';
import { logError } from '../lib/logger.js';

const prisma = getPrismaClient();

export async function projectRoutes(fastify) {
  const { requireAuth, requireRoles } = createAuthGuards(fastify);
  const allowAllRoles = requireRoles(['ADMIN', 'DEVELOPER', 'TESTER']);

  /**
   * Get project statistics
   * Provides counts and metrics for project resources
   */
  fastify.get(
    '/api/projects/:projectId/statistics',
    { preHandler: [requireAuth, allowAllRoles] },
    async (request, reply) => {
      try {
        const projectId = Number(request.params.projectId);

        if (Number.isNaN(projectId)) {
          return reply.code(400).send({ error: 'Invalid project ID' });
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, name: true, key: true },
        });

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Get all statistics in parallel
        const [
          testCaseStats,
          bugStats,
          executionStats,
          testRunStats,
          activeMembers,
          recentActivity,
        ] = await Promise.all([
          // Test Case Statistics
          prisma.testCase.aggregate({
            where: { projectId, deletedAt: null },
            _count: true,
          }).then(async (total) => {
            const byPriority = await prisma.testCase.groupBy({
              by: ['priority'],
              where: { projectId, deletedAt: null },
              _count: true,
            });

            const byStatus = await prisma.testCase.groupBy({
              by: ['status'],
              where: { projectId, deletedAt: null },
              _count: true,
            });

            const automated = await prisma.testCase.count({
              where: { projectId, deletedAt: null, isAutomated: true },
            });

            return {
              total: total._count,
              automated,
              manual: total._count - automated,
              byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count;
                return acc;
              }, {}),
              byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
              }, {}),
            };
          }),

          // Bug Statistics
          prisma.bug.aggregate({
            where: { projectId },
            _count: true,
          }).then(async (total) => {
            const byStatus = await prisma.bug.groupBy({
              by: ['status'],
              where: { projectId },
              _count: true,
            });

            const byPriority = await prisma.bug.groupBy({
              by: ['priority'],
              where: { projectId },
              _count: true,
            });

            const bySeverity = await prisma.bug.groupBy({
              by: ['severity'],
              where: { projectId },
              _count: true,
            });

            const openBugs = await prisma.bug.count({
              where: {
                projectId,
                status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] },
              },
            });

            const closedBugs = await prisma.bug.count({
              where: {
                projectId,
                status: { in: ['RESOLVED', 'CLOSED', 'VERIFIED'] },
              },
            });

            return {
              total: total._count,
              open: openBugs,
              closed: closedBugs,
              byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
              }, {}),
              byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count;
                return acc;
              }, {}),
              bySeverity: bySeverity.reduce((acc, item) => {
                acc[item.severity] = item._count;
                return acc;
              }, {}),
            };
          }),

          // Execution Statistics (last 30 days)
          (async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const executions = await prisma.testExecution.findMany({
              where: {
                testCase: { projectId },
                executedAt: { gte: thirtyDaysAgo },
              },
              select: { status: true },
            });

            const total = executions.length;
            const passed = executions.filter((e) => e.status === 'PASSED').length;
            const failed = executions.filter((e) => e.status === 'FAILED').length;
            const skipped = executions.filter((e) => e.status === 'SKIPPED').length;
            const blocked = executions.filter((e) => e.status === 'BLOCKED').length;

            return {
              last30Days: {
                total,
                passed,
                failed,
                skipped,
                blocked,
                passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
              },
            };
          })(),

          // Test Run Statistics
          (async () => {
            const total = await prisma.testRun.count({
              where: { 
                testSuite: { projectId },
              },
            });

            const completed = await prisma.testRun.count({
              where: {
                testSuite: { projectId },
                status: 'COMPLETED',
              },
            });

            const inProgress = await prisma.testRun.count({
              where: {
                testSuite: { projectId },
                status: 'IN_PROGRESS',
              },
            });

            return {
              total,
              completed,
              inProgress,
            };
          })(),

          // Active Members
          prisma.projectUserAllocation.count({
            where: { projectId },
          }),

          // Recent Activity (last 7 days)
          (async () => {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const [testCasesCreated, bugsReported, executionsRun] = await Promise.all([
              prisma.testCase.count({
                where: {
                  projectId,
                  createdAt: { gte: sevenDaysAgo },
                },
              }),
              prisma.bug.count({
                where: {
                  projectId,
                  createdAt: { gte: sevenDaysAgo },
                },
              }),
              prisma.testExecution.count({
                where: {
                  testCase: { projectId },
                  executedAt: { gte: sevenDaysAgo },
                },
              }),
            ]);

            return {
              last7Days: {
                testCasesCreated,
                bugsReported,
                executionsRun,
              },
            };
          })(),
        ]);

        reply.send({
          project: {
            id: project.id,
            name: project.name,
            key: project.key,
          },
          statistics: {
            testCases: testCaseStats,
            bugs: bugStats,
            executions: executionStats,
            testRuns: testRunStats,
            activeMembers,
            recentActivity,
          },
        });
      } catch (error) {
        logError('Error fetching project statistics:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );

  /**
   * Get project overview
   * Provides dashboard data with recent items and quick stats
   */
  fastify.get(
    '/api/projects/:projectId/overview',
    { preHandler: [requireAuth, allowAllRoles] },
    async (request, reply) => {
      try {
        const projectId = Number(request.params.projectId);

        if (Number.isNaN(projectId)) {
          return reply.code(400).send({ error: 'Invalid project ID' });
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            createdAt: true,
          },
        });

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Get overview data in parallel
        const [
          quickStats,
          recentBugs,
          recentTestCases,
          recentExecutions,
          upcomingMilestones,
        ] = await Promise.all([
          // Quick Stats
          (async () => {
            const [totalTestCases, totalBugs, openBugs, activeMilestones] = await Promise.all([
              prisma.testCase.count({
                where: { projectId, deletedAt: null },
              }),
              prisma.bug.count({
                where: { projectId },
              }),
              prisma.bug.count({
                where: {
                  projectId,
                  status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] },
                },
              }),
              prisma.milestone.count({
                where: {
                  projectId,
                  status: { in: ['OPEN', 'IN_PROGRESS'] },
                },
              }),
            ]);

            return {
              totalTestCases,
              totalBugs,
              openBugs,
              activeMilestones,
            };
          })(),

          // Recent Bugs (last 5)
          prisma.bug.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              bugNumber: true,
              title: true,
              status: true,
              priority: true,
              severity: true,
              createdAt: true,
              reporter: {
                select: { id: true, name: true, email: true },
              },
            },
          }),

          // Recent Test Cases (last 5)
          prisma.testCase.findMany({
            where: { projectId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              createdAt: true,
              createdBy: {
                select: { id: true, name: true, email: true },
              },
            },
          }),

          // Recent Executions (last 10)
          prisma.testExecution.findMany({
            where: {
              testCase: { projectId },
            },
            orderBy: { executedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              status: true,
              executedAt: true,
              executionTime: true,
              testCase: {
                select: { id: true, name: true },
              },
              executor: {
                select: { id: true, name: true, email: true },
              },
            },
          }),

          // Upcoming Milestones (next 5)
          prisma.milestone.findMany({
            where: {
              projectId,
              dueDate: { gte: new Date() },
              status: { not: 'COMPLETED' },
            },
            orderBy: { dueDate: 'asc' },
            take: 5,
            select: {
              id: true,
              title: true,
              dueDate: true,
              status: true,
              progress: true,
            },
          }),
        ]);

        reply.send({
          project,
          overview: {
            quickStats,
            recentBugs,
            recentTestCases,
            recentExecutions,
            upcomingMilestones,
          },
        });
      } catch (error) {
        logError('Error fetching project overview:', error);
        reply.code(500).send({ error: error.message });
      }
    },
  );
}

export default projectRoutes;
