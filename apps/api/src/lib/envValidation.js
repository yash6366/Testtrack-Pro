/**
 * ENVIRONMENT VARIABLE VALIDATION
 * Validates required environment variables at server startup
 * Prevents server from starting with incomplete configuration
 */

import { logError } from './logger.js';

// Define required environment variables
const requiredEnvVars = {
  // Core configuration
  DATABASE_URL: 'Database connection string',
  JWT_SECRET: 'JWT signing secret key',
  
  // Frontend configuration
  FRONTEND_URL: 'Frontend application URL',
};

// Define optional but recommended environment variables
const recommendedEnvVars = {
  // Server configuration
  PORT: 'Server port (default: 3001)',
  NODE_ENV: 'Environment (development/production/test)',
  
  // ...existing code...
  
  // Email service
  RESEND_API_KEY: 'Resend email API key',
  RESEND_FROM_EMAIL: 'Email sender address',
  
  // File uploads
  CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name',
  CLOUDINARY_API_KEY: 'Cloudinary API key',
  CLOUDINARY_API_SECRET: 'Cloudinary API secret',
  
  // Redis (for scaling)
  REDIS_URL: 'Redis connection URL',
  UPSTASH_REDIS_REST_URL: 'Upstash Redis REST URL',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis REST token',
  
  // Monitoring
  SENTRY_DSN: 'Sentry error tracking DSN',
  
  // Security
  FORCE_HTTPS: 'Force HTTPS in production (true/false)',
};

/**
 * Validate that required environment variables are set
 * @param {boolean} throwOnError - Whether to throw or just warn
 * @throws {Error} If any required environment variable is missing and throwOnError is true
 */
export function validateRequiredEnvVars(throwOnError = true) {
  const missingVars = [];
  
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missingVars.push({ name: varName, description });
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missingVars
      .map(v => `  - ${v.name}: ${v.description}`)
      .join('\n')}\n\nPlease check your .env file or environment configuration.`;
    
    if (throwOnError) {
      logError('Environment validation failed', new Error(errorMessage));
      throw new Error(errorMessage);
    } else {
      console.warn('⚠️ ', errorMessage);
      return false;
    }
  }
  return true;
}

/**
 * Warn about missing recommended environment variables
 */
export function warnMissingRecommendedEnvVars() {
  const missingVars = [];
  
  for (const [varName, description] of Object.entries(recommendedEnvVars)) {
    if (!process.env[varName]) {
      missingVars.push({ name: varName, description });
    }
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:');
    missingVars.forEach(v => {
      console.warn(`   - ${v.name}: ${v.description}`);
    });
    console.warn('   Some features may not work correctly.\n');
  }
}

/**
 * Validate specific environment variable formats
 */
export function validateEnvVarFormats() {
  const errors = [];
  
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://');
  }
  
  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  }
  
  // Validate URLs
  const urlVars = ['FRONTEND_URL', 'WEBHOOK_BASE_URL', 'REDIS_URL', 'UPSTASH_REDIS_REST_URL'];
  for (const varName of urlVars) {
    if (process.env[varName]) {
      try {
        new URL(process.env[varName]);
      } catch {
        errors.push(`${varName} must be a valid URL`);
      }
    }
  }
  
  // Validate boolean values
  const boolVars = ['FORCE_HTTPS', 'ENABLE_SWAGGER'];
  for (const varName of boolVars) {
    if (process.env[varName] && !['true', 'false'].includes(process.env[varName])) {
      errors.push(`${varName} must be 'true' or 'false'`);
    }
  }
  
  // Validate NODE_ENV
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push("NODE_ENV must be 'development', 'production', or 'test'");
  }
  
  // Validate port number
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid port number (1-65535)');
    }
  }
  
  if (errors.length > 0) {
    const errorMessage = `Invalid environment variable formats:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    logError('Environment format validation failed', new Error(errorMessage));
    throw new Error(errorMessage);
  }
}

/**
 * Run all environment variable validations
 * @param {boolean} throwOnError - Whether to throw or just warn on errors
 */
export function validateEnvironment(throwOnError = true) {
  console.log('🔍 Validating environment variables...');
  
  try {
    const hasRequired = validateRequiredEnvVars(throwOnError);
    validateEnvVarFormats();
    warnMissingRecommendedEnvVars();
    
    if (hasRequired) {
      console.log('✅ Environment validation passed\n');
    } else {
      console.warn('⚠️  Environment validation completed with warnings\n');
    }
    return hasRequired;
  } catch (error) {
    if (throwOnError) {
      console.error('❌ Environment validation failed\n');
      throw error;
    } else {
      console.warn('⚠️  Environment validation failed, continuing anyway\n');
      return false;
    }
  }
}
