
import { PrismaClient } from '@prisma/client';
import { logError } from './logger.js';

let prisma;
let connectionAttempt = null;

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  // Use the DATABASE_URL as-is (no pooling params)
  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
  return baseClient;
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
