# End-to-End Testing Framework

## Overview

This directory contains end-to-end (E2E) tests for TestTrack Pro using Playwright.

## Setup

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm exec playwright test tests/auth.spec.ts

# Run tests in debug mode
pnpm exec playwright test --debug
```

## Test Structure

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Authentication flows
│   ├── test-execution.spec.ts  # Test execution workflow
│   ├── bug-workflow.spec.ts    # Bug management workflow
│   └── test-case-crud.spec.ts  # Test case CRUD operations
├── fixtures/
│   └── test-data.ts            # Shared test data
└── helpers/
    └── test-helpers.ts         # Helper functions
```

## Critical User Journeys

### 1. Complete Test Workflow
- User registration → verification → login
- Create test case
- Execute test case
- Report bug from failed test
- Developer fixes bug
- Tester verifies fix

### 2. Bug Management Workflow
- Developer receives bug assignment
- Documents fix with commit details
- Requests retest
- Tester verifies and closes

### 3. Suite Execution
- Create test suite
- Add multiple test cases
- Execute entire suite
- Review execution report

## Writing Tests

### Example Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register, login, and access dashboard', async ({ page }) => {
    // Registration
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Verify email sent message
    await expect(page.locator('text=Verification email sent')).toBeVisible();
    
    // Login after email verification (mock)
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Best Practices

1. **Use Page Object Model** - Encapsulate page interactions
2. **Independent Tests** - Each test should be self-contained
3. **Clean Test Data** - Create and cleanup test data
4. **Meaningful Assertions** - Verify user-visible outcomes
5. **Wait for Navigation** - Use Playwright's auto-waiting
6. **Screenshot on Failure** - Enabled by default

## CI/CD Integration

Tests run automatically in GitHub Actions on every pull request.

See `.github/workflows/e2e-tests.yml` for configuration.

## Debugging

```bash
# Run with trace viewer
pnpm exec playwright test --trace on

# View traces
pnpm exec playwright show-trace trace.zip

# Generate detailed HTML report
pnpm exec playwright show-report
```

## Configuration

See `playwright.config.ts` for:
- Base URL
- Timeouts
- Browser configurations
- Screenshot/video settings
- Retry logic
