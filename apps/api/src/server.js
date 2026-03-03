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
import backupRoutes from './routes/backup.js';
import healthRoutes, { setServerInitStatus } from './routes/health.js';
import userProfileRoutes from './routes/userProfile.js';
import userSessionRoutes from './routes/userSession.js';

// Validate environment variables before starting server (non-fatal in production)
if (process.env.NODE_ENV !== 'test') {
  const isValid = validateEnvironment(false); // Don't throw, just warn
  if (!isValid && process.env.NODE_ENV !== 'production') {
    // Only exit in dev if validation fails
    console.error('Environment validation failed in development mode. Exiting.');
    process.exit(1);
  }
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

// Register health check routes FIRST (critical for Railway/K8s health checks)
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
fastify.register(backupRoutes, { prefix: '/api/admin/backup' });

// Track initialization status for health checks
let initializationComplete = false;
let initializationError = null;

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    
    // START LISTENING IMMEDIATELY - Critical for health checks
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port} - health checks available`);
    
    // Background initialization - happens AFTER server is listening
    // This prevents Railway health check timeouts
    setImmediate(async () => {
      try {
        fastify.log.info('Starting background initialization...');
        
        // Ensure Prisma is connected
        await ensurePrismaConnected();
        fastify.log.info('✓ Database connection established');
        
        // Initialize role-based channels
        await initializeRoleChannels();
        fastify.log.info('✓ Role-based channels initialized');
        
        // Ensure all users in universal channel
        await ensureAllUsersInUniversalChannel();
        fastify.log.info('✓ Universal channel synchronized');
        
        // Setup Socket.IO
        const io = setupSocket(fastify);
        fastify.log.info('✓ Socket.IO initialized');
        
        // Initialize notification emitter
        initializeNotificationEmitter(io);
        fastify.log.info('✓ Notification emitter initialized');
        
        // Initialize cron jobs for background processing
        initializeCronJobs();
        fastify.log.info('✓ Cron jobs initialized');
        
        // Store io on fastify for access in routes
        fastify.io = io;
        
        initializationComplete = true;
        setServerInitStatus(true); // Update health check status
        fastify.log.info('🚀 Full initialization complete - all systems operational');
      } catch (err) {
        initializationError = err;
        setServerInitStatus(false, err); // Update health check with error
        fastify.log.error({ err }, '❌ Background initialization failed - server running in degraded mode');
        // Don't exit - server can still serve health checks and some endpoints
      }
    });
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Export initialization status for health checks
export { initializationComplete, initializationError };
