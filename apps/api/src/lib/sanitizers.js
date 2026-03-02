/**
 * SANITIZATION WRAPPERS
 * Reusable sanitization for common input types
 * Prevents XSS attacks by escaping HTML, limiting string sizes, and validating content
 */

import { sanitizeText, sanitizeHtml } from './sanitization.js';

/**
 * Sanitize bug description
 * Max 5000 chars, escapes HTML, disallows scripts
 */
export function sanitizeBugDescription(text) {
  return sanitizeText(text, {
    minLength: 10,
    maxLength: 5000,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize comment/message
 * Max 2000 chars, escapes HTML
 */
export function sanitizeComment(text) {
  return sanitizeText(text, {
    minLength: 1,
    maxLength: 2000,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize test case title
 * Max 255 chars
 */
export function sanitizeTestCaseTitle(text) {
  return sanitizeText(text, {
    minLength: 3,
    maxLength: 255,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize test case description
 * Max 3000 chars
 */
export function sanitizeTestCaseDescription(text) {
  return sanitizeText(text, {
    minLength: 10,
    maxLength: 3000,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize steps to reproduce
 */
export function sanitizeStepsToReproduce(text) {
  return sanitizeText(text, {
    minLength: 10,
    maxLength: 2000,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize code/technical content (don't escape, but limit)
 */
export function sanitizeCodeContent(text) {
  return sanitizeText(text, {
    minLength: 1,
    maxLength: 10000,
    escapeHtml: false,  // Allow code formatting
    trim: false,  // Preserve whitespace in code
  });
}

/**
 * Sanitize project name
 */
export function sanitizeProjectName(text) {
  return sanitizeText(text, {
    minLength: 3,
    maxLength: 255,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize user name
 */
export function sanitizeUserName(text) {
  return sanitizeText(text, {
    minLength: 2,
    maxLength: 255,
    escapeHtml: true,
    trim: true,
  });
}

/**
 * Sanitize chat message
 */
export function sanitizeChatMessage(text) {
  return sanitizeText(text, {
    minLength: 1,
    maxLength: 500,
    escapeHtml: true,
    trim: true,
  });
}
