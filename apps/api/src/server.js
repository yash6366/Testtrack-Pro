import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import { setupCors } from './plugins/cors.js';
import { setupJwt } from './plugins/jwt.js';
import { setupHelmet } from './plugins/helmet.js';
import { httpsEnforcementPlugin, httpsSecurityHeadersPlugin } from './plugins/httpsEnforcement.js';
import { setupSwagger } from './plugins/swagger.js';
import { rateLimitPlugin } from './plugins/rateLimit.js';
import { csrfProtectionPlugin } from './plugins/csrfProtection.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { requestContextPlugin } from './plugins/requestContext.js';
import { initializeLogger, createRequestLoggerMiddleware, logInfo, logError } from './lib/logger.js';
import { validateEnvironment } from './lib/envValidation.js';
import { setupSocket, initializeRedis } from './lib/socket.js';
import { initializeNotificationEmitter } from './services/notificationEmitter.js';
import { initializeCronJobs } from './services/cronService.js';
import { ensureAllUsersInUniversalChannel } from './services/channelService.js';
import { ensurePrismaConnected } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import testRoutes from './routes/tests.js';
import chatRoutes from './routes/chat.js';
import directMessageRoutes from './routes/directMessage.js';
import channelRoutes, { initializeRoleChannels, autoJoinRoleChannels } from './routes/channels.js';
import adminRoutes from './routes/admin.js';
import testerRoutes from './routes/tester.js';
import developerRoutes from './routes/developer.js';
import evidenceRoutes from './routes/evidence.js';
import testRunRoutes from './routes/testRuns.js';
import executionRoutes from './routes/executions.js';
import bugRoutes from './routes/bugs.js';
import { testSuiteRoutes } from './routes/testSuites.js';
import analyticsRoutes from './routes/analytics.js';
import { notificationRoutes } from './routes/notification.js';
import { searchRoutes } from './routes/search.js';
import webhookRoutes from './routes/webhooks.js';
import projectRoutes from './routes/projects.js';
import milestoneRoutes from './routes/milestones.js';
import testPlanRoutes from './routes/testPlans.js';
import apiKeyRoutes from './routes/apiKeys.js';
import githubRoutes from './routes/github.js';
import scheduledReportsRoutes from './routes/scheduledReports.js';
import healthRoutes from './routes/health.js';
import userProfileRoutes from './routes/userProfile.js';
import userSessionRoutes from './routes/userSession.js';

// Validate environment variables before starting server
if (process.env.NODE_ENV !== 'test') {
  validateEnvironment();
}

const fastify = Fastify({ logger: true });

// Initialize structured logging
initializeLogger(fastify.log);

// Log server startup
logInfo('Starting TestTrack Pro API server');

// Register error handler EARLY (before other plugins/routes)
await fastify.register(errorHandlerPlugin);

// Register request context plugin (adds request IDs for tracing)
await fastify.register(requestContextPlugin);

// Register request logging middleware
await fastify.register(async (fastify) => {
  fastify.addHook('onRequest', await createRequestLoggerMiddleware());
});
await setupCors(fastify);
await setupJwt(fastify);
await setupHelmet(fastify);

// HTTPS enforcement and security headers
await fastify.register(httpsEnforcementPlugin);
await fastify.register(httpsSecurityHeadersPlugin);

await fastify.register(rateLimitPlugin);
await fastify.register(csrfProtectionPlugin);

// Register Swagger (disabled in production)
const isProduction = process.env.NODE_ENV === 'production';
const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || !isProduction;
if (enableSwagger) {
  await setupSwagger(fastify);
}

// Register health check routes
fastify.register(healthRoutes);

// Register routes
fastify.register(authRoutes);
fastify.register(userProfileRoutes);
fastify.register(userSessionRoutes);
fastify.register(testRoutes);
fastify.register(chatRoutes);
fastify.register(directMessageRoutes);
fastify.register(channelRoutes);
fastify.register(adminRoutes);
fastify.register(testerRoutes);
fastify.register(developerRoutes);
fastify.register(evidenceRoutes);
fastify.register(testRunRoutes);
fastify.register(executionRoutes);
fastify.register(bugRoutes);
fastify.register(testSuiteRoutes);
fastify.register(analyticsRoutes);
fastify.register(notificationRoutes);
fastify.register(searchRoutes);
fastify.register(webhookRoutes);
fastify.register(projectRoutes);
fastify.register(milestoneRoutes);
fastify.register(testPlanRoutes);
fastify.register(apiKeyRoutes);
fastify.register(githubRoutes);
fastify.register(scheduledReportsRoutes);

// Start server
const start = async () => {
  try {
    // Ensure Prisma is connected before using it
    await ensurePrismaConnected();
    logInfo('Database connection established');
    
    // Initialize role-based channels
    await initializeRoleChannels();
    logInfo('Role-based channels initialized');
    
    await ensureAllUsersInUniversalChannel();
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server running on port ${port}`);

    // Setup Socket.IO after server is listening
    const io = setupSocket(fastify);
    fastify.log.info('Socket.IO initialized');
    
    // Initialize notification emitter
    initializeNotificationEmitter(io);
    fastify.log.info('Notification emitter initialized');

    // Initialize cron jobs for background processing
    initializeCronJobs();
    fastify.log.info('Cron jobs initialized');
    
    // Store io on fastify for access in routes
    fastify.io = io;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
