/**
 * VITEST CONFIGURATION
 * Setup for testing API routes and services
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['**/*.test.js', '**/*.spec.js'],
    exclude: ['node_modules', 'dist', 'build'],
    reporters: ['default', 'html'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/dist/**',
        'prisma/',
        'scripts/',
        'check-failed-deliveries.js',
        'diagnose-notifications.js',
        'test-*.js',
      ],
      // Coverage thresholds - enforce minimum 70% as per production audit
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
