import helmet from '@fastify/helmet';

/**
 * Helmet Security Plugin
 * Configures security headers including CSP, HSTS, and others
 */
export async function setupHelmet(fastify) {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await fastify.register(helmet, {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", frontendUrl],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    
    // HTTP Strict Transport Security (HSTS)
    // Force HTTPS for 1 year, including subdomains
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    
    // Prevent clickjacking attacks
    frameguard: {
      action: 'deny',
    },
    
    // Prevent MIME type sniffing
    noSniff: true,
    
    // Control DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },
    
    // Prevent IE from executing downloads in site's context
    ieNoOpen: true,
    
    // Remove X-Powered-By header
    hidePoweredBy: true,
    
    // Control browser features and APIs
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  });

  fastify.log.info('Helmet security headers configured');
}
