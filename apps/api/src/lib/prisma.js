import { PrismaClient } from '@prisma/client';
import { logError } from './logger.js';

let prisma;
let connectionAttempt = null;

function createPrismaClient() {
  // Extract DATABASE_URL and add connection pooling parameters
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Add connection pooling parameters to the DATABASE_URL
  const urlWithPooling = addPoolingParams(databaseUrl);
  
  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: urlWithPooling,
      },
    },
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

  return baseClient;
}

/**
 * Add connection pooling parameters to the database URL
 * @param {string} url - The original database URL
 * @returns {string} - The database URL with pooling parameters
 */
function addPoolingParams(url) {
  const urlObj = new URL(url);
  
  // Set connection pooling parameters
  // connection_limit: Maximum number of database connections (default: 10)
  // pool_timeout: Seconds to wait for a connection from the pool (default: 10)
  // statement_cache_size: Number of prepared statements to cache (default: 500)
  
  const existingParams = urlObj.searchParams;
  
  if (!existingParams.has('connection_limit')) {
    existingParams.set('connection_limit', process.env.DB_POOL_SIZE || '10');
  }
  
  if (!existingParams.has('pool_timeout')) {
    existingParams.set('pool_timeout', process.env.DB_POOL_TIMEOUT || '20');
  }
  
  if (!existingParams.has('statement_cache_size')) {
    existingParams.set('statement_cache_size', '500');
  }
  
  return urlObj.toString();
}

export function getPrismaClient() {
  if (!prisma) {
    prisma = createPrismaClient();
    if (!connectionAttempt) {
      connectionAttempt = prisma.$connect().catch((err) => {
        logError('Prisma connection failed:', err);
        throw err;
      });
    }
  }
  return prisma;
}

export async function ensurePrismaConnected() {
  getPrismaClient();
  if (connectionAttempt) {
    await connectionAttempt;
  }
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

export function systemQueryRaw(strings, ...values) {
  const client = getPrismaClient();
  return client.$queryRaw(strings, ...values);
}
