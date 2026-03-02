/**
 * INPUT SANITIZATION TESTS
 * Tests for sanitization of user input to prevent XSS and injection attacks
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeBugDescription,
  sanitizeComment,
  sanitizeTestCaseTitle,
  sanitizeTestCaseDescription,
  sanitizeStepsToReproduce,
  sanitizeCodeContent,
  sanitizeProjectName,
  sanitizeUserName,
  sanitizeChatMessage,
} from '../src/lib/sanitizers.js';

describe('Input Sanitization', () => {
  describe('sanitizeBugDescription', () => {
    it('should allow valid descriptions', () => {
      const input = 'The login button is not responding to clicks in the production environment';
      const result = sanitizeBugDescription(input);
      expect(result).toBe(input);
    });

    it('should escape HTML tags', () => {
      const input = 'This is a <script>alert("xss")</script> test';
      const result = sanitizeBugDescription(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script');
    });

    it('should trim whitespace', () => {
      const input = '   A valid description   ';
      const result = sanitizeBugDescription(input);
      expect(result).toBe('A valid description');
    });

    it('should throw error if too short', () => {
      const input = 'short';
      expect(() => sanitizeBugDescription(input)).toThrow();
    });

    it('should throw error if too long', () => {
      const input = 'a'.repeat(6000);
      expect(() => sanitizeBugDescription(input)).toThrow();
    });
  });

  describe('sanitizeComment', () => {
    it('should allow valid comments', () => {
      const input = 'This issue is critical and needs immediate attention';
      const result = sanitizeComment(input);
      expect(result).toBe(input);
    });

    it('should escape HTML in comments', () => {
      const input = 'I found <img src=x onerror="alert(1)"> a bug';
      const result = sanitizeComment(input);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    it('should reject empty comments', () => {
      expect(() => sanitizeComment('')).toThrow();
    });

    it('should reject comments over 2000 chars', () => {
      const input = 'a'.repeat(2001);
      expect(() => sanitizeComment(input)).toThrow();
    });
  });

  describe('sanitizeTestCaseTitle', () => {
    it('should allow valid titles', () => {
      const input = 'User can login with valid credentials';
      const result = sanitizeTestCaseTitle(input);
      expect(result).toBe(input);
    });

    it('should escape HTML in titles', () => {
      const input = 'Login <b onclick="alert(1)">Test</b>';
      const result = sanitizeTestCaseTitle(input);
      expect(result).not.toContain('onclick');
    });

    it('should limit title to 255 chars', () => {
      const input = 'a'.repeat(300);
      expect(() => sanitizeTestCaseTitle(input)).toThrow();
    });
  });

  describe('sanitizeCodeContent', () => {
    it('should preserve code formatting without escaping', () => {
      const input = 'function test() { return <Component />; }';
      const result = sanitizeCodeContent(input);
      // Code content should NOT be escaped (it's meant for code)
      expect(result).toContain('</Component>');
    });

    it('should preserve whitespace in code', () => {
      const input = 'function test() {\n  return true;\n}';
      const result = sanitizeCodeContent(input);
      expect(result).toContain('\n');
    });

    it('should allow large code blocks', () => {
      const input = `function largeFunction() {
        // Large code block
        ${'  code\n'.repeat(100)}
      }`;
      // Should not throw for up to 10000 chars
      expect(() => sanitizeCodeContent(input)).not.toThrow();
    });
  });

  describe('sanitizeProjectName', () => {
    it('should allow valid project names', () => {
      const input = 'TestTrack Pro v2.0';
      const result = sanitizeProjectName(input);
      expect(result).toBe(input);
    });

    it('should escape special characters', () => {
      const input = 'Project<injected>';
      const result = sanitizeProjectName(input);
      expect(result).not.toContain('<injected>');
    });

    it('should reject short names', () => {
      expect(() => sanitizeProjectName('ab')).toThrow();
    });
  });

  describe('sanitizeChatMessage', () => {
    it('should allow valid messages', () => {
      const input = 'Hey team, the bug is fixed!';
      const result = sanitizeChatMessage(input);
      expect(result).toBe(input);
    });

    it('should escape HTML in messages', () => {
      const input = 'Check this out: <a href="javascript:alert(1)">link</a>';
      const result = sanitizeChatMessage(input);
      expect(result).not.toContain('javascript:');
    });

    it('should limit message to 500 chars', () => {
      const input = 'a'.repeat(501);
      expect(() => sanitizeChatMessage(input)).toThrow();
    });

    it('should allow emoji and special characters', () => {
      const input = 'Bug fixed! 🎉 #release 🚀';
      const result = sanitizeChatMessage(input);
      expect(result).toContain('🎉');
      expect(result).toContain('🚀');
    });
  });

  describe('Common attack vectors', () => {
    const xssTests = [
      '<script>alert("xss")</script>',
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      '<iframe src="evil.com"></iframe>',
      '<body onload="alert(1)">',
      '<input onfocus="alert(1)">',
    ];

    xssTests.forEach((attack) => {
      it(`should block XSS attack: ${attack.substring(0, 20)}...`, () => {
        const result = sanitizeComment(attack);
        // Should either escape or reject
        expect(result).not.toMatch(/onclick|onerror|onload|onfocus|javascript:/i);
      });
    });
  });
});
