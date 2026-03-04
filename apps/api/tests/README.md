# TestTrack Pro - Test Suite

> **Doc sync note (2026-03-04):** Test suite updated. Include tests for webhookService and direct messaging.

This directory contains tests for the TestTrack Pro API.

## Overview

Tests are organized by feature/concern:
- `setup.js` - Shared test utilities and fixtures
- `auth.test.js` - Authentication routes (signup, login, logout, refresh)
- `rbac.test.js` - Role-Based Access Control and authorization
- `errorHandler.test.js` - Global error handler plugin

## Running Tests

```bash
# Run all tests in watch mode
pnpm test

# Run all tests once
pnpm test:run

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
vitest tests/auth.test.js
```

## Test Coverage Goals

Priority order for test implementation:

1. **Authentication (Critical)** ✅
   - Signup/registration with validation
   - Login with credentials
   - Token refresh
   - Logout & session invalidation
   - Password security

2. **Authorization & RBAC (Critical)** ✅
   - Role-based access control
   - Permission checking
   - Token validation
   - Request context (request IDs)

3. **Error Handling (Critical)** ✅
   - Global error handler
   - Proper status codes
   - Safe error messages
   - No stack trace exposure

4. **API Key Management (High Priority)**
   - API key creation and hashing
   - API key validation
   - API key revocation
   - Secure storage verification

5. **Database Operations (High Priority)**
   - CRUD operations
   - N+1 query prevention
   - Transaction handling
   - Soft deletes

6. **Bug Management (Core Feature)**
   - Bug creation
   - Status transitions
   - Assignment logic
   - Bug lifecycle

7. **Test Case Management (Core Feature)**
   - Test case CRUD
   - Test execution
   - Result tracking

8. **Analytics (Feature)**
   - Query performance
   - Data accuracy
   - Concurrent access

## Test Utilities

The `setup.js` file provides:

- `buildTestApp()` - Creates a test Fastify instance
- `createTestUser(app, type)` - Creates test users (admin, developer, tester)
- `makeAuthRequest(app, method, url, payload, token)` - Helper for authenticated requests
- `assertStatus(response, expectedStatus)` - Assert response status
- `parseResponse(response)` - Parse JSON response
- `testUsers` - Fixture with test user data

## Writing New Tests

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, createTestUser } from './setup.js';

describe('Feature Name', () => {
  let app;
  let user;

  beforeAll(async () => {
    app = await buildTestApp();
    user = await createTestUser(app, 'developer');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should do something', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/endpoint',
      payload: { /* data */ },
      headers: {
        authorization: `Bearer ${user.token}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## CI/CD Integration

These tests should run on:
- Every pull request
- Before production deployment
- Nightly builds (for extended test suites)

Add to your CI configuration:
```bash
pnpm test:run
```

## Known Issues / TODO

- [ ] API Key hashing tests
- [ ] Database transaction tests
- [ ] Concurrent access tests
- [ ] Performance benchmarks
- [ ] WebSocket/Socket.IO tests
- [ ] Email notification tests
- [ ] File upload tests
- [ ] Rate limiting tests

## Best Practices

1. **Use fixtures**: Create test users/data in beforeAll
2. **Cleanup**: Always close app in afterAll
3. **Isolation**: Each test should be independent
4. **Descriptive names**: Test names should clearly state what's being tested
5. **Security focus**: Test auth paths thoroughly
6. **Edge cases**: Test boundary conditions and error cases

## Debugging Tests

Enable debug output:
```bash
DEBUG_TESTS=true pnpm test
```

Or run a single test:
```bash
vitest tests/auth.test.js -t "should login"
```

## Coverage Reports

After running `pnpm test:coverage`, view the report:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

Target: 70%+ coverage on critical paths (auth, RBAC, error handling)
