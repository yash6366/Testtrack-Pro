/**
 * REQUEST CONTEXT PLUGIN
 * Adds request ID and logging context to all requests
 * Enables distributed tracing across services
 */

import crypto from 'crypto';

export async function requestContextPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Generate unique request ID if not provided
    request.id = request.headers['x-request-id'] || 
                 crypto.randomUUID();
    
    // Set context for logging
    request.logContext = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userId: request.user?.id,
    };
    
    // Add to response headers for client reference
    reply.header('x-request-id', request.id);
    
    // Log start of request (minimal, to reduce log noise)
    if (request.method !== 'GET') {
      fastify.log.info(`[${request.id}] ${request.method} ${request.url}`);
    }
  });
  
  fastify.addHook('onResponse', async (request, reply) => {
    // Log response time for monitoring
    const responseTime = reply.getResponseTime?.() || 0;
    const level = reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info';
    
    fastify.log[level]({
      requestId: request.id,
      method: request.method,
      path: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: Math.round(responseTime),
    });
  });
}
