/**
 * QUERY CACHING SERVICE
 * 
 * Implements Redis-based caching with in-memory fallback and TTL
 * Reduces database queries by caching:
 * - Test plans (3600s TTL)
 * - Test cases (1800s TTL)
 * - Projects (3600s TTL)
 * - Users (7200s TTL)
 * 
 * Cache invalidation on mutations is handled automatically
 * Falls back to in-memory cache when Redis is unavailable
 */

import { logInfo, logWarn, logError } from '../lib/logger.js';
import Redis from 'ioredis';

// Redis client
let redisClient = null;
let isRedisAvailable = false;

// In-memory fallback cache
const cache = new Map();
const cacheTimers = new Map();

// Initialize Redis if URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logInfo('Redis cache connected');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logError('Redis cache error, falling back to in-memory:', err);
    });

    redisClient.on('close', () => {
      isRedisAvailable = false;
      logWarn('Redis cache disconnected, using in-memory cache');
    });
  } catch (error) {
    logError('Failed to initialize Redis cache:', error);
    redisClient = null;
  }
}

// Configuration (in seconds)
const CACHE_CONFIG = {
  testPlan: 3600, // 1 hour - Test plans rarely change during execution
  testCase: 1800, // 30 minutes - Test cases semi-static
  project: 3600, // 1 hour - Project settings stable
  user: 7200, // 2 hours - User data relatively stable
  testRun: 300, // 5 minutes - Test runs update frequently
  notification: 60, // 1 minute - Notifications expire quickly
};

/**
 * Generate cache key from entity type and ID
 * @param {string} entityType - Type of entity (testPlan, user, etc.)
 * @param {number|string} id - Entity ID
 * @returns {string} Cache key
 */
function getCacheKey(entityType, id) {
  return `testtrack:${entityType}:${id}`;
}

/**
 * Get value from cache if not expired
 * @param {string} entityType - Type of entity
 * @param {number|string} id - Entity ID
 * @returns {Promise<any|null>} Cached value or null if expired/missing
 */
export async function getCachedValue(entityType, id) {
  const key = getCacheKey(entityType, id);
  
  // Try Redis first if available
  if (isRedisAvailable && redisClient) {
    try {
      const value = await redisClient.get(key);
      if (value) {
        logInfo(`Redis Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logInfo(`Redis Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logError('Redis get error, falling back to in-memory:', error);
      isRedisAvailable = false;
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  if (cache.has(key)) {
    logInfo(`Memory Cache HIT: ${key}`);
    return cache.get(key);
  }
  
  logInfo(`Memory Cache MISS: ${key}`);
  return null;
}

/**
 * Set value in cache with TTL
 * @param {string} entityType - Type of entity
 * @param {number|string} id - Entity ID
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional, uses default)
 */
export async function setCachedValue(entityType, id, value, ttl = null) {
  const key = getCacheKey(entityType, id);
  const cacheTTL = ttl || CACHE_CONFIG[entityType] || 3600;
  
  // Try Redis first if available
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.setex(key, cacheTTL, JSON.stringify(value));
      logInfo(`Redis Cache SET: ${key} (TTL: ${cacheTTL}s)`);
      return;
    } catch (error) {
      logError('Redis set error, falling back to in-memory:', error);
      isRedisAvailable = false;
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  // Clear existing timer
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key));
  }
  
  // Set new value
  cache.set(key, value);
  logInfo(`Memory Cache SET: ${key} (TTL: ${cacheTTL}s)`);
  
  // Set expiration timer
  const timer = setTimeout(() => {
    cache.delete(key);
    cacheTimers.delete(key);
    logInfo(`Memory Cache EXPIRED: ${key}`);
  }, cacheTTL * 1000);
  
  cacheTimers.set(key, timer);
}

/**
 * Invalidate cache entry immediately
 * @param {string} entityType - Type of entity
 * @param {number|string} id - Entity ID
 */
export async function invalidateCache(entityType, id) {
  const key = getCacheKey(entityType, id);
  
  // Try Redis first if available
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
      logInfo(`Redis Cache INVALIDATED: ${key}`);
      return;
    } catch (error) {
      logError('Redis delete error, falling back to in-memory:', error);
      isRedisAvailable = false;
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  if (cache.has(key)) {
    cache.delete(key);
    if (cacheTimers.has(key)) {
      clearTimeout(cacheTimers.get(key));
      cacheTimers.delete(key);
    }
    logInfo(`Memory Cache INVALIDATED: ${key}`);
  }
}

/**
 * Invalidate all cache entries of a type
 * @param {string} entityType - Type of entity (testPlan, user, etc.)
 */
export async function invalidateCacheByType(entityType) {
  const pattern = `testtrack:${entityType}:*`;
  
  // Try Redis first if available
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logInfo(`Redis Cache INVALIDATED (${entityType}): ${keys.length} entries`);
      }
      return;
    } catch (error) {
      logError('Redis keys/delete error, falling back to in-memory:', error);
      isRedisAvailable = false;
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  const prefix = `testtrack:${entityType}:`;
  let count = 0;
  
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key));
        cacheTimers.delete(key);
      }
      count++;
    }
  }
  
  logInfo(`Memory Cache INVALIDATED (${entityType}): ${count} entries`);
}

/**
 * Invalidate related caches when an entity is updated
 * Useful for cascading updates
 * 
 * @param {string} entityType - Type of entity that was updated
 * @param {number|string} id - Entity ID
 */
export function invalidateRelatedCaches(entityType, id) {
  // When a test plan is updated, also invalidate related test case caches
  if (entityType === 'testPlan') {
    // Would need to track test case IDs - implementation depends on schema
    invalidateCache('testPlan', id);
  }
  
  // When a project is updated, invalidate all test plans in project
  if (entityType === 'project') {
    invalidateCacheByType('testPlan');
  }
  
  // When user is updated, invalidate user cache
  if (entityType === 'user') {
    invalidateCache('user', id);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const entries = Array.from(cache.entries());
  const stats = {
    totalEntries: cache.size,
    totalSize: entries.reduce((sum, [_, val]) => sum + JSON.stringify(val).length, 0),
    entriesByType: {},
  };
  
  entries.forEach(([key, _]) => {
    const type = key.split(':')[0];
    stats.entriesByType[type] = (stats.entriesByType[type] || 0) + 1;
  });
  
  return stats;
}

/**
 * Clear all cache entries
 */
export async function clearAllCache() {
  // Try Redis first if available
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys('testtrack:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logInfo(`Redis Cache CLEARED: ${keys.length} entries removed`);
      }
      return;
    } catch (error) {
      logError('Redis clear error, falling back to in-memory:', error);
      isRedisAvailable = false;
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  const size = cache.size;
  
  // Clear all timers
  for (const timer of cacheTimers.values()) {
    clearTimeout(timer);
  }
  
  cache.clear();
  cacheTimers.clear();
  
  logInfo(`Memory Cache CLEARED: ${size} entries removed`);
}

/**
 * Disconnect Redis client on shutdown
 */
export async function disconnectCache() {
  if (redisClient) {
    await redisClient.quit();
    logInfo('Redis cache disconnected');
  }
}

/**
 * Wrapper to get value from cache or fetch from database
 * @param {string} entityType - Type of entity
 * @param {number|string} id - Entity ID
 * @param {Function} fetchFn - Async function to fetch from DB if not cached
 * @returns {Promise<any>} Cached or fetched value
 */
export async function getOrFetchCached(entityType, id, fetchFn) {
  // Try cache first
  const cached = await getCachedValue(entityType, id);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch from database
  const value = await fetchFn();
  
  if (value) {
    await setCachedValue(entityType, id, value);
  }
  
  return value;
}

export default {
  getCachedValue,
  setCachedValue,
  invalidateCache,
  invalidateCacheByType,
  invalidateRelatedCaches,
  getCacheStats,
  clearAllCache,
  getOrFetchCached,
  disconnectCache,
  CACHE_CONFIG,
  isRedisAvailable: () => isRedisAvailable,
};
