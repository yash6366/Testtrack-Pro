/**
 * PAGINATION UTILITIES
 * Safe pagination parsing and helper functions
 * Prevents abuse of pagination parameters (skip, take)
 */

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

/**
 * Parse and validate pagination params from query string
 * Ensures skip and take are safe integers within bounds
 * @param {object} query - Query parameters
 * @returns {object} { skip, take (page size) }
 */
export function parsePaginationParams(query) {
  let skip = 0;
  let take = DEFAULT_PAGE_SIZE;
  
  // Parse skip (offset)
  if (query.skip !== undefined) {
    const parsed = parseInt(query.skip, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      skip = parsed;
    }
  }
  
  // Parse take (limit)
  if (query.take !== undefined) {
    const parsed = parseInt(query.take, 10);
    if (!isNaN(parsed) && parsed >= MIN_PAGE_SIZE) {
      take = Math.min(parsed, MAX_PAGE_SIZE);  // Cap at max
    }
  }
  
  return { skip, take };
}

/**
 * Build paginated response with metadata
 * @param {array} data - The items in this page
 * @param {number} total - Total count of all items
 * @param {number} skip - Offset position
 * @param {number} take - Page size
 * @returns {object} Response with pagination metadata
 */
export function buildPaginatedResponse(data, total, skip, take) {
  const pageNumber = Math.floor(skip / take) + 1;
  const totalPages = Math.ceil(total / take);
  
  return {
    data,
    pagination: {
      total,
      count: data.length,
      skip,
      take,
      hasMore: skip + take < total,
      pages: totalPages,
      currentPage: pageNumber,
    },
  };
}

/**
 * Get skip/take for page number (1-indexed)
 * @param {number} pageNumber - Page (1, 2, 3, etc)
 * @param {number} pageSize - Items per page
 * @returns {object} { skip, take }
 */
export function getPageBounds(pageNumber = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.floor(pageNumber));
  const size = Math.min(Math.max(pageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
  
  return {
    skip: (page - 1) * size,
    take: size,
  };
}

/**
 * Get pagination bounds from before/after cursor
 * Useful for cursor-based pagination
 * @param {string} cursor - Base64-encoded cursor
 * @param {number} pageSize - Items per page
 * @returns {object} { skip, take }
 */
export function getPaginationFromCursor(cursor, pageSize = DEFAULT_PAGE_SIZE) {
  try {
    if (!cursor) {
      return { skip: 0, take: pageSize };
    }
    
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const offset = parseInt(decoded, 10);
    
    if (isNaN(offset) || offset < 0) {
      return { skip: 0, take: pageSize };
    }
    
    return {
      skip: offset,
      take: Math.min(pageSize, MAX_PAGE_SIZE),
    };
  } catch (error) {
    return { skip: 0, take: pageSize };
  }
}

/**
 * Create cursor for next page
 * @param {number} skip - Current skip
 * @param {number} take - Current take (page size)
 * @returns {string} Base64-encoded cursor
 */
export function createNextCursor(skip, take) {
  const nextOffset = skip + take;
  return Buffer.from(String(nextOffset), 'utf-8').toString('base64');
}

/**
 * Constants for use in pagination
 */
export const PaginationDefaults = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
};
