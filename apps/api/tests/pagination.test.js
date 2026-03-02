/**
 * PAGINATION TESTS
 * Tests for pagination utilities and list endpoint pagination
 */

import { describe, it, expect } from 'vitest';
import {
  parsePaginationParams,
  buildPaginatedResponse,
  getPageBounds,
  createNextCursor,
  getPaginationFromCursor,
} from '../src/lib/pagination.js';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should return defaults when query is empty', () => {
      const params = parsePaginationParams({});
      expect(params.skip).toBe(0);
      expect(params.take).toBe(20); // Default page size
    });

    it('should parse valid skip and take', () => {
      const params = parsePaginationParams({ skip: '10', take: '50' });
      expect(params.skip).toBe(10);
      expect(params.take).toBe(50);
    });

    it('should cap take at maximum page size', () => {
      const params = parsePaginationParams({ take: '5000' });
      expect(params.take).toBeLessThanOrEqual(100); // MAX_PAGE_SIZE
    });

    it('should handle negative skip', () => {
      const params = parsePaginationParams({ skip: '-10' });
      expect(params.skip).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-numeric values', () => {
      const params = parsePaginationParams({ skip: 'abc', take: 'xyz' });
      expect(params.skip).toBe(0);
      expect(params.take).toBe(20);
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should build response with correct pagination metadata', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = buildPaginatedResponse(data, 100, 0, 20);

      expect(response.data).toEqual(data);
      expect(response.pagination.total).toBe(100);
      expect(response.pagination.count).toBe(2);
      expect(response.pagination.skip).toBe(0);
      expect(response.pagination.take).toBe(20);
      expect(response.pagination.pages).toBe(5); // 100 / 20
      expect(response.pagination.currentPage).toBe(1);
    });

    it('should indicate when there are no more results', () => {
      const response = buildPaginatedResponse([], 10, 10, 20);
      expect(response.pagination.hasMore).toBe(false);
    });

    it('should indicate when there are more results', () => {
      const response = buildPaginatedResponse([{ id: 1 }], 100, 0, 20);
      expect(response.pagination.hasMore).toBe(true);
    });
  });

  describe('getPageBounds', () => {
    it('should calculate bounds for first page', () => {
      const bounds = getPageBounds(1, 20);
      expect(bounds.skip).toBe(0);
      expect(bounds.take).toBe(20);
    });

    it('should calculate bounds for second page', () => {
      const bounds = getPageBounds(2, 20);
      expect(bounds.skip).toBe(20);
      expect(bounds.take).toBe(20);
    });

    it('should handle zero page number', () => {
      const bounds = getPageBounds(0, 20);
      expect(bounds.skip).toBe(0); // Should default to page 1
    });

    it('should cap page size at maximum', () => {
      const bounds = getPageBounds(1, 5000);
      expect(bounds.take).toBeLessThanOrEqual(100);
    });
  });

  describe('Cursor-based pagination', () => {
    it('should create and parse cursor', () => {
      const cursor = createNextCursor(20, 20);
      expect(cursor).toBeTruthy();

      const bounds = getPaginationFromCursor(cursor, 20);
      expect(bounds.skip).toBe(40);
      expect(bounds.take).toBe(20);
    });

    it('should handle missing cursor', () => {
      const bounds = getPaginationFromCursor(null, 20);
      expect(bounds.skip).toBe(0);
      expect(bounds.take).toBe(20);
    });

    it('should handle invalid cursor', () => {
      const bounds = getPaginationFromCursor('invalid-cursor', 20);
      expect(bounds.skip).toBe(0);
      expect(bounds.take).toBe(20);
    });
  });
});
