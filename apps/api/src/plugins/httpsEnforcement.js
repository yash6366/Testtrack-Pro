/**
 * HTTPS Enforcement Plugin
 * Redirects HTTP requests to HTTPS in production
 * Implements security best practices for TLS/SSL
 */

/**
 * Fastify plugin to enforce HTTPS in production
 * @param {object} fastify - Fastify instance
 * @param {object} options - Plugin options
 */
export async function httpsEnforcementPlugin(fastify, options) {
  const isProduction = process.env.NODE_ENV === 'production';
  const forceHttps = process.env.FORCE_HTTPS === 'true';

  // Only enforce HTTPS in production or when explicitly enabled
  if (!isProduction && !forceHttps) {
    fastify.log.info('HTTPS enforcement disabled (development mode)');
    return;
  }

  const healthPaths = ['/health', '/api/health', '/api/health/live', '/api/health/ready', '/api/health/status', '/api/health/metrics'];

  fastify.addHook('onRequest', async (request, reply) => {
    if (healthPaths.some(path => request.url === path || request.url.startsWith(`${path}?`))) {
      return;
    }

    // Check if request is already using HTTPS
    const isHttps = isSecureRequest(request);

    if (!isHttps) {
      // Redirect HTTP to HTTPS
      const host = request.headers.host || request.hostname;
      const url = `https://${host}${request.url}`;
      
      fastify.log.warn({
        msg: 'Redirecting HTTP to HTTPS',
        from: request.url,
        to: url,
        ip: request.ip,
      });

      // 301 Permanent Redirect
      return reply.code(301).redirect(url);
    }
  });

  fastify.log.info('HTTPS enforcement enabled');
}

/**
 * Check if a request is secure (HTTPS)
 * Handles various proxy scenarios (Nginx, Cloudflare, AWS ALB, etc.)
 * 
 * @param {object} request - Fastify request object
 * @returns {boolean} True if request is secure
 */
function isSecureRequest(request) {
  // Direct HTTPS connection
  if (request.protocol === 'https') {
    return true;
  }

  // Check X-Forwarded-Proto header (set by reverse proxies)
  const forwardedProto = request.headers['x-forwarded-proto'];
  if (forwardedProto === 'https') {
    return true;
  }

  // Check Cloudflare CF-Visitor header
  const cfVisitor = request.headers['cf-visitor'];
  if (cfVisitor) {
    try {
      const visitor = JSON.parse(cfVisitor);
      if (visitor.scheme === 'https') {
        return true;
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  // Check Front-End-Https header (IIS)
  if (request.headers['front-end-https'] === 'on') {
    return true;
  }

  // Check X-Forwarded-Ssl header
  if (request.headers['x-forwarded-ssl'] === 'on') {
    return true;
  }

  // Check X-Url-Scheme header
  if (request.headers['x-url-scheme'] === 'https') {
    return true;
  }

  return false;
}

/**
 * Middleware to set security headers for HTTPS
 * @param {object} fastify - Fastify instance
 */
export async function httpsSecurityHeadersPlugin(fastify, options) {
  fastify.addHook('onSend', async (request, reply) => {
    // Only set HTTPS headers if request is secure
    if (isSecureRequest(request)) {
      // Set Strict-Transport-Security header (already done by Helmet, but ensuring)
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
  });

  fastify.log.info('HTTPS security headers plugin enabled');
}

export default {
  httpsEnforcementPlugin,
  httpsSecurityHeadersPlugin,
};
