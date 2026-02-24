# TestTrack Pro - API Reference

Complete REST API documentation. For interactive API exploration, visit `/documentation` after starting the server.

## Authentication

### JWT Authentication

All endpoints except `/api/auth/*` require Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Obtain Token

**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "TESTER"
  }
}
```

### Refresh Token

**POST** `/api/auth/refresh`

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Users

### List Users

**GET** `/api/admin/users`

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role (ADMIN, TESTER, DEVELOPER)
- `search` (string): Search by email or name

Response:
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "TESTER",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 15
}
```

### Get User

**GET** `/api/admin/users/:userId`

Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "TESTER",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Create User

**POST** `/api/admin/users`

Request:
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "SecurePassword123!",
  "role": "TESTER"
}
```

Response: `201 Created`

### Update User

**PATCH** `/api/admin/users/:userId`

Request:
```json
{
  "name": "Jane Smith Updated",
  "role": "DEVELOPER"
}
```

Response: `200 OK`

### Delete User

**DELETE** `/api/admin/users/:userId`

Response: `204 No Content`

## Projects

### List Projects

**GET** `/api/projects`

Query Parameters:
- `page` (number): Pagination
- `search` (string): Search by name

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Web App v2.0",
      "description": "Testing web application",
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### Get Project

**GET** `/api/projects/:projectId`

Response:
```json
{
  "id": 1,
  "name": "Web App v2.0",
  "description": "Testing web application",
  "createdAt": "2024-01-10T08:00:00Z",
  "members": [
    {
      "userId": 1,
      "email": "user@example.com",
      "role": "LEAD"
    }
  ]
}
```

### Create Project

**POST** `/api/projects`

Request:
```json
{
  "name": "Mobile App v1.0",
  "description": "Testing mobile application"
}
```

Response: `201 Created`

### Update Project

**PATCH** `/api/projects/:projectId`

Request:
```json
{
  "name": "Mobile App v1.1",
  "description": "Updated description"
}
```

Response: `200 OK`

### Add Project Member

**POST** `/api/projects/:projectId/members`

Request:
```json
{
  "userId": 2,
  "role": "TESTER"
}
```

Response: `200 OK`

## Test Cases

### List Test Cases

**GET** `/api/projects/:projectId/tests`

Query Parameters:
- `page` (number): Pagination
- `status` (string): DRAFT, READY, DEPRECATED
- `priority` (string): LOW, MEDIUM, HIGH, CRITICAL
- `search` (string): Search by title

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "User Login Flow",
      "description": "Verify user can login with valid credentials",
      "type": "FUNCTIONAL",
      "priority": "HIGH",
      "status": "READY",
      "steps": 5,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Test Case

**GET** `/api/projects/:projectId/tests/:testId`

Response:
```json
{
  "id": 1,
  "title": "User Login Flow",
  "description": "Verify user can login with valid credentials",
  "type": "FUNCTIONAL",
  "priority": "HIGH",
  "status": "READY",
  "steps": [
    {
      "id": 1,
      "title": "Open login page",
      "expectedResult": "Login form is displayed"
    },
    {
      "id": 2,
      "title": "Enter valid credentials",
      "expectedResult": "User is logged in"
    }
  ]
}
```

### Create Test Case

**POST** `/api/projects/:projectId/tests`

Request:
```json
{
  "title": "User Registration",
  "description": "Test user registration flow",
  "type": "FUNCTIONAL",
  "priority": "HIGH",
  "steps": [
    {
      "title": "Navigate to signup page",
      "expectedResult": "Signup form is displayed"
    },
    {
      "title": "Fill in registration details",
      "expectedResult": "All fields accept input"
    }
  ]
}
```

Response: `201 Created`

### Update Test Case

**PATCH** `/api/projects/:projectId/tests/:testId`

Request:
```json
{
  "title": "User Registration v2",
  "status": "READY"
}
```

Response: `200 OK`

### Delete Test Case

**DELETE** `/api/projects/:projectId/tests/:testId`

Response: `204 No Content`

## Test Execution

### Create Test Run

**POST** `/api/projects/:projectId/test-runs`

Request:
```json
{
  "name": "Sprint 5 Testing",
  "environment": "STAGING",
  "buildVersion": "1.2.0",
  "testIds": [1, 2, 3]
}
```

Response: `201 Created`

### List Test Runs

**GET** `/api/projects/:projectId/test-runs`

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Sprint 5 Testing",
      "environment": "STAGING",
      "status": "IN_PROGRESS",
      "passCount": 15,
      "failCount": 2,
      "totalTests": 20,
      "passRate": 75,
      "startedAt": "2024-02-01T09:00:00Z"
    }
  ]
}
```

### Get Test Run

**GET** `/api/projects/:projectId/test-runs/:runId`

Response:
```json
{
  "id": 1,
  "name": "Sprint 5 Testing",
  "environment": "STAGING",
  "buildVersion": "1.2.0",
  "status": "COMPLETED",
  "startedAt": "2024-02-01T09:00:00Z",
  "completedAt": "2024-02-01T17:30:00Z",
  "executions": [
    {
      "id": 1,
      "testId": 1,
      "testTitle": "User Login",
      "status": "PASS",
      "timeSpent": 300,
      "comment": "Passed all steps"
    }
  ]
}
```

### Execute Test Case

**POST** `/api/test-runs/:runId/executions/:executionId/steps/:stepId`

Request:
```json
{
  "status": "PASS",
  "actualResult": "Login successful",
  "comment": "Worked as expected"
}
```

Response: `200 OK`

### Complete Test Execution

**PATCH** `/api/test-runs/:runId/executions/:executionId`

Request:
```json
{
  "status": "PASS",
  "comment": "All steps passed"
}
```

Response: `200 OK`

## Evidence

### List All Evidence for Project

**GET** `/api/projects/:projectId/evidence`

Get all evidence files across all test executions in a project.

Response:
```json
{
  "evidence": [
    {
      "id": 1,
      "executionId": 123,
      "stepId": 1,
      "fileUrl": "https://res.cloudinary.com/...",
      "fileName": "screenshot.png",
      "fileType": "image/png",
      "fileSize": 102400,
      "uploadedAt": "2024-01-15T14:30:00Z",
      "uploadedBy": 5,
      "execution": {
        "id": 123,
        "testCaseId": 45,
        "testCase": {
          "id": 45,
          "title": "Login Test"
        }
      }
    }
  ]
}
```

### List Evidence for Test Execution

**GET** `/api/projects/:projectId/test-executions/:executionId/evidence`

Get all evidence files for a specific test execution.

Response:
```json
{
  "evidence": [
    {
      "id": 1,
      "executionId": 123,
      "stepId": 1,
      "fileUrl": "https://res.cloudinary.com/...",
      "fileName": "screenshot.png",
      "fileType": "image/png",
      "fileSize": 102400,
      "uploadedAt": "2024-01-15T14:30:00Z",
      "uploadedBy": 5
    }
  ]
}
```

### List Evidence for Test Step

**GET** `/api/projects/:projectId/test-executions/:executionId/steps/:stepId/evidence`

Get all evidence files for a specific test execution step.

### Create Signed Upload URL

**POST** `/api/projects/:projectId/test-executions/:executionId/steps/:stepId/evidence/signature`

Get a signed URL for uploading evidence to Cloudinary.

Request:
```json
{
  "fileName": "screenshot.png",
  "fileType": "image/png",
  "fileSize": 102400
}
```

Response:
```json
{
  "signature": "abc123...",
  "timestamp": 1634567890,
  "cloudName": "your-cloud",
  "apiKey": "your-key",
  "folder": "evidence/project-1"
}
```

### Create Evidence Record

**POST** `/api/projects/:projectId/test-executions/:executionId/steps/:stepId/evidence`

Create an evidence record after uploading to Cloudinary.

Request:
```json
{
  "fileUrl": "https://res.cloudinary.com/...",
  "fileName": "screenshot.png",
  "fileType": "image/png",
  "fileSize": 102400,
  "metadata": {
    "width": 1920,
    "height": 1080
  }
}
```

Response: `201 Created`

### Delete Evidence

**DELETE** `/api/projects/:projectId/evidence/:evidenceId`

Soft delete an evidence file.

Response:
```json
{
  "id": 1,
  "isDeleted": true,
  "deletedAt": "2024-01-15T15:00:00Z"
}
```

## Bugs/Defects

### List Bugs

**GET** `/api/projects/:projectId/bugs`

Query Parameters:
- `status` (string): NEW, ASSIGNED, IN_PROGRESS, FIXED, CLOSED
- `priority` (string): LOW, MEDIUM, HIGH, CRITICAL
- `severity` (string): MINOR, MAJOR, CRITICAL
- `assignee` (number): User ID
- `search` (string): Search in title/description

Response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Login button not clickable",
      "description": "On mobile, login button is not responsive",
      "status": "ASSIGNED",
      "priority": "HIGH",
      "severity": "MAJOR",
      "reportedBy": {
        "id": 5,
        "name": "John Doe"
      },
      "assignedTo": {
        "id": 3,
        "name": "Dev Team"
      },
      "createdAt": "2024-02-10T14:20:00Z"
    }
  ]
}
```

### Get Bug

**GET** `/api/projects/:projectId/bugs/:bugId`

Response:
```json
{
  "id": 1,
  "title": "Login button not clickable",
  "description": "On mobile, login button is not responsive",
  "status": "ASSIGNED",
  "priority": "HIGH",
  "severity": "MAJOR",
  "environment": "STAGING",
  "reportedBy": {
    "id": 5,
    "name": "John Doe"
  },
  "assignedTo": {
    "id": 3,
    "name": "Dev Team"
  },
  "linkedTests": [1, 2],
  "attachments": ["screenshot.png"],
  "comments": [
    {
      "id": 1,
      "author": "dev@example.com",
      "text": "Fixed in v1.2.1",
      "createdAt": "2024-02-11T10:00:00Z"
    }
  ]
}
```

### Create Bug

**POST** `/api/projects/:projectId/bugs`

Request:
```json
{
  "title": "Login button not clickable",
  "description": "On mobile, login button is not responsive",
  "priority": "HIGH",
  "severity": "MAJOR",
  "environment": "STAGING",
  "linkedTestIds": [1, 2],
  "attachments": ["screenshot.png"]
}
```

Response: `201 Created`

### Update Bug

**PATCH** `/api/projects/:projectId/bugs/:bugId`

Request:
```json
{
  "status": "FIXED",
  "priority": "MEDIUM",
  "assignedTo": 3
}
```

Response: `200 OK`

### Add Bug Comment

**POST** `/api/projects/:projectId/bugs/:bugId/comments`

Request:
```json
{
  "text": "Fixed in PR #234"
}
```

Response: `201 Created`

### Verify Bug Fix

**POST** `/api/projects/:projectId/bugs/:bugId/verify`

Request:
```json
{
  "verified": true,
  "comment": "Verified in staging environment"
}
```

Response: `200 OK`

### Document Bug Fix (NEW in V1)

**PATCH** `/api/projects/:projectId/bugs/:bugId/fix-documentation`

Request:
```json
{
  "fixStrategy": "Refactored login validation logic to handle special characters properly. Updated regex pattern to be more permissive.",
  "rootCauseAnalysis": "The password validation regex was too restrictive and incorrectly rejected valid special characters supported by backend.",
  "rootCauseCategory": "IMPLEMENTATION_ERROR",
  "fixedInCommitHash": "a3f7c89d4e2b1f6a9c8e3d2f1a0b9c8d7e6f5a4",
  "fixBranchName": "fix/login-validation-chars",
  "codeReviewUrl": "https://github.com/org/repo/pull/1234",
  "targetFixVersion": "0.6.3",
  "fixedInVersion": "0.6.3",
  "actualFixHours": 4.5
}
```

Response: `200 OK`

**Response:**
```json
{
  "id": 1,
  "title": "Login button not clickable",
  "status": "FIXED",
  "fixStrategy": "Refactored login validation logic...",
  "rootCauseAnalysis": "The password validation regex...",
  "rootCauseCategory": "IMPLEMENTATION_ERROR",
  "fixedInCommitHash": "a3f7c89d4e2b1f6a9c8e3d2f1a0b9c8d7e6f5a4",
  "fixBranchName": "fix/login-validation-chars",
  "codeReviewUrl": "https://github.com/org/repo/pull/1234",
  "targetFixVersion": "0.6.3",
  "fixedInVersion": "0.6.3",
  "actualFixHours": 4.5,
  "updatedAt": "2024-02-12T15:30:00Z"
}
```

**Root Cause Categories:**
- `DESIGN_DEFECT`: Flaw in system design
- `IMPLEMENTATION_ERROR`: Coding error
- `ENVIRONMENTAL_ISSUE`: Environment-related
- `THIRD_PARTY_LIBRARY`: Third-party library issue
- `DOCUMENTATION_ERROR`: Documentation mistake led to bug
- `CONFIGURATION_ISSUE`: Configuration problem
- `OTHER`: Other cause

## Analytics & Reports

### Get Execution Trends

**GET** `/api/projects/:projectId/analytics/execution-trends`

Query Parameters:
- `weeks` (number): Number of weeks (default: 8)

Response:
```json
{
  "projectId": 1,
  "timeframe": "8 weeks",
  "data": [
    {
      "week": "2024-01-01",
      "total": 45,
      "passed": 40,
      "failed": 3,
      "blocked": 2,
      "passRate": 88.9
    }
  ],
  "summary": {
    "avgPassRate": 85.5,
    "trend": "improving"
  }
}
```

### Get Flaky Tests

**GET** `/api/projects/:projectId/analytics/flaky-tests`

Query Parameters:
- `runsThreshold` (number): Minimum runs to consider (default: 5)

Response:
```json
{
  "projectId": 1,
  "data": [
    {
      "testCaseId": 15,
      "testCaseName": "User Login with Special Characters",
      "flakeRate": 45.0,
      "recentRuns": 10,
      "passedRuns": 6,
      "failedRuns": 4
    },
    {
      "testCaseId": 22,
      "testCaseName": "Database Connection Retry",
      "flakeRate": 30.0,
      "recentRuns": 10,
      "passedRuns": 7,
      "failedRuns": 3
    }
  ]
}
```

### Get Execution Speed Analysis

**GET** `/api/projects/:projectId/analytics/execution-speed`

Query Parameters:
- `days` (number): Days to analyze (default: 30)

Response:
```json
{
  "projectId": 1,
  "days": 30,
  "total": {
    "count": 500,
    "p50": 120,
    "p95": 480,
    "p99": 720,
    "avg": 185,
    "min": 30,
    "max": 900
  },
  "byStatus": {
    "passed": {
      "count": 450,
      "avg": 170,
      "p95": 450
    },
    "failed": {
      "count": 50,
      "avg": 280,
      "p95": 600
    }
  }
}
```

### Get Bug Trend Analysis

**GET** `/api/projects/:projectId/analytics/bug-trends`

Query Parameters:
- `weeks` (number): Number of weeks (default: 8)

Response:
```json
{
  "projectId": 1,
  "weeks": 8,
  "data": [
    {
      "week": "2024-01-01",
      "created": 12,
      "resolved": 8,
      "reopened": 1,
      "velocity": 4
    }
  ],
  "currentVelocity": 3
}
```

### Get Test Analytics

**GET** `/api/projects/:projectId/analytics/tests`

Response:
```json
{
  "totalTests": 150,
  "passedTests": 120,
  "failedTests": 20,
  "blockedTests": 10,
  "passRate": 80,
  "executionTrend": [
    {
      "date": "2024-02-01",
      "passed": 15,
      "failed": 2,
      "blocked": 1
    }
  ]
}
```

### Get Bug Analytics

**GET** `/api/projects/:projectId/analytics/bugs`

Response:
```json
{
  "totalBugs": 50,
  "openBugs": 15,
  "closedBugs": 35,
  "byPriority": {
    "LOW": 5,
    "MEDIUM": 20,
    "HIGH": 15,
    "CRITICAL": 10
  },
  "bySeverity": {
    "MINOR": 10,
    "MAJOR": 25,
    "CRITICAL": 15
  },
  "avgTimeToClose": 86400
}
```

### Get Developer Analytics (NEW in V1)

**GET** `/api/projects/:projectId/analytics/developers`

Query Parameters:
- `weeks` (number): Number of weeks to analyze (default: 8)

Response:
```json
{
  "projectId": 1,
  "weeks": 8,
  "developers": [
    {
      "developerId": 3,
      "developerName": "Alice Smith",
      "bugCount": 18,
      "avgFixTimeHours": 4.5,
      "rootCauseDistribution": {
        "DESIGN_DEFECT": 2,
        "IMPLEMENTATION_ERROR": 10
      },
      "trend": "improving"
    }
  ]
}
```

### Export Report

**GET** `/api/projects/:projectId/reports/export?format=pdf&startDate=2024-02-01&endDate=2024-02-28`

Query Parameters:
- `format` (string): pdf, excel, json
- `startDate` (string): ISO date
- `endDate` (string): ISO date

Response: File download

## Webhooks

### Create Webhook

**POST** `/api/projects/:projectId/webhooks`

Request:
```json
{
  "url": "https://your-domain.com/webhooks/testtrack",
  "events": ["test.completed", "bug.created", "execution.finished"],
  "active": true
}
```

Response: `201 Created`

### List Webhooks

**GET** `/api/projects/:projectId/webhooks`

### Delete Webhook

**DELETE** `/api/projects/:projectId/webhooks/:webhookId`

Response: `204 No Content`

### Webhook Events

Webhook payload structure:

```json
{
  "id": "webhook-event-123",
  "event": "test.completed",
  "timestamp": "2024-02-12T10:30:00Z",
  "project": {
    "id": 1,
    "name": "Web App v2.0"
  },
  "data": {
    "testId": 5,
    "status": "PASS",
    "timeSpent": 120
  }
}
```

## Health Checks

### Basic Health

**GET** `/health`

Response:
```json
{
  "status": "ok"
}
```

### Detailed Health

**GET** `/api/health/status`

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-12T10:30:00Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "redis": {
    "status": "connected",
    "responseTime": 2
  }
}
```

### Readiness

**GET** `/api/health/ready`

Response: `204 No Content` (ready) or `503 Service Unavailable` (not ready)

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource exists)
- `500` - Internal Server Error

## Rate Limiting

Rate limits are enforced per user per minute:

- Public endpoints: 60 requests/minute
- Authenticated endpoints: 180 requests/minute
- Admin endpoints: 300 requests/minute

Response headers:
```
X-RateLimit-Limit: 180
X-RateLimit-Remaining: 175
X-RateLimit-Reset: 1707735360
```

## Pagination

List endpoints use cursor-based pagination:

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

Response:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

## WebSocket Events

Connect to `/socket.io`:

```javascript
const socket = io('http://localhost:3001');

// Listen for notifications
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
});

// Listen for test execution updates
socket.on('execution:update', (data) => {
  console.log('Execution updated:', data);
});

// Listen for real-time chat messages
socket.on('chat:message', (data) => {
  console.log('New message:', data);
});
```

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3001/api'
});

// Login
const { data } = await client.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

client.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

// Get projects
const projects = await client.get('/projects');
console.log(projects.data);
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3001/api'

# Login
response = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})

token = response.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# Get projects
projects = requests.get(f'{BASE_URL}/projects', headers=headers)
print(projects.json())
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get projects (with token)
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```
## Test Plans

### Create Test Plan

**POST** `/api/projects/:projectId/test-plans`

Request:
```json
{
  "name": "Sprint 10 Regression Plan",
  "description": "Full regression testing for Sprint 10 release",
  "scope": "All critical user flows",
  "testCaseIds": [1, 2, 3, 5, 8],
  "startDate": "2024-03-01T09:00:00Z",
  "endDate": "2024-03-05T17:00:00Z",
  "plannerNotes": "Focus on payment gateway changes"
}
```

Response: `201 Created`

### List Test Plans

**GET** `/api/projects/:projectId/test-plans`

Query Parameters:
- `skip` (number): Pagination offset
- `take` (number): Items per page
- `status` (string): Filter by status (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
- `search` (string): Search by name or description

Response:
```json
{
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "name": "Sprint 10 Regression Plan",
      "status": "ACTIVE",
      "totalTestCases": 15,
      "startDate": "2024-03-01T09:00:00Z",
      "planner": {
        "id": 2,
        "name": "Jane Smith"
      }
    }
  ],
  "total": 25
}
```

### Get Test Plan

**GET** `/api/projects/:projectId/test-plans/:testPlanId`

Response:
```json
{
  "id": 1,
  "name": "Sprint 10 Regression Plan",
  "description": "Full regression testing",
  "scope": "All critical user flows",
  "status": "ACTIVE",
  "testCaseIds": [1, 2, 3],
  "totalTestCases": 15,
  "startDate": "2024-03-01T09:00:00Z",
  "endDate": "2024-03-05T17:00:00Z",
  "plannerNotes": "Focus on payment gateway"
}
```

### Update Test Plan

**PATCH** `/api/projects/:projectId/test-plans/:testPlanId`

Request:
```json
{
  "status": "COMPLETED",
  "plannerNotes": "All tests passed"
}
```

Response: `200 OK`

### Delete Test Plan

**DELETE** `/api/projects/:projectId/test-plans/:testPlanId`

Response: `204 No Content`

### Execute Test Plan

**POST** `/api/projects/:projectId/test-plans/:testPlanId/execute`

Request:
```json
{
  "environment": "STAGING",
  "buildVersion": "1.5.0"
}
```

Response: `201 Created` (returns test run ID)

### Clone Test Plan

**POST** `/api/projects/:projectId/test-plans/:testPlanId/clone`

Request:
```json
{
  "name": "Sprint 11 Regression Plan"
}
```

Response: `201 Created`

## Milestones

### Create Milestone

**POST** `/api/projects/:projectId/milestones`

Request:
```json
{
  "name": "Q1 2024 Release",
  "description": "Major feature release for Q1",
  "targetStartDate": "2024-01-01T00:00:00Z",
  "targetEndDate": "2024-03-31T23:59:59Z",
  "priority": "HIGH",
  "notes": "Critical release for enterprise clients"
}
```

Response: `201 Created`

### List Milestones

**GET** `/api/projects/:projectId/milestones`

Query Parameters:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
- `priority` (string): LOW, MEDIUM, HIGH, CRITICAL
- `search` (string): Search in name/description

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Q1 2024 Release",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "completionPercent": 65,
      "targetEndDate": "2024-03-31T23:59:59Z",
      "testCasesCount": 45,
      "defectsCount": 12
    }
  ],
  "total": 8
}
```

### Get Milestone

**GET** `/api/projects/:projectId/milestones/:milestoneId`

Response:
```json
{
  "id": 1,
  "projectId": 1,
  "name": "Q1 2024 Release",
  "description": "Major feature release",
  "status": "IN_PROGRESS",
  "targetStartDate": "2024-01-01T00:00:00Z",
  "targetEndDate": "2024-03-31T23:59:59Z",
  "actualStartDate": "2024-01-05T09:00:00Z",
  "completionPercent": 65,
  "priority": "HIGH",
  "notes": "Critical release"
}
```

### Update Milestone

**PATCH** `/api/projects/:projectId/milestones/:milestoneId`

Request:
```json
{
  "status": "COMPLETED",
  "actualEndDate": "2024-03-28T17:00:00Z",
  "completionPercent": 100
}
```

Response: `200 OK`

### Delete Milestone

**DELETE** `/api/projects/:projectId/milestones/:milestoneId`

Response: `204 No Content`

### Assign Test Cases to Milestone

**POST** `/api/projects/:projectId/milestones/:milestoneId/test-cases`

Request:
```json
{
  "testCaseIds": [1, 2, 3, 5, 8]
}
```

Response: `200 OK`

### Assign Defects to Milestone

**POST** `/api/projects/:projectId/milestones/:milestoneId/defects`

Request:
```json
{
  "defectIds": [10, 11, 12]
}
```

Response: `200 OK`

### Get Milestone Progress

**GET** `/api/projects/:projectId/milestones/:milestoneId/progress`

Response:
```json
{
  "milestoneId": 1,
  "completionPercent": 65,
  "testCases": {
    "total": 45,
    "passed": 30,
    "failed": 5,
    "blocked": 2,
    "notRun": 8
  },
  "defects": {
    "total": 12,
    "open": 3,
    "inProgress": 4,
    "fixed": 5,
    "closed": 0
  }
}
```

## API Keys

### Create API Key

**POST** `/api/projects/:projectId/api-keys`

Request:
```json
{
  "name": "CI/CD Pipeline Key",
  "description": "For Jenkins integration",
  "scopes": ["test:read", "test:execute", "bug:create"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Response:
```json
{
  "id": 1,
  "name": "CI/CD Pipeline Key",
  "key": "ttk_live_a3f7c89d4e2b1f6a9c8e3d2f1a0b9c8d",
  "scopes": ["test:read", "test:execute", "bug:create"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "createdAt": "2024-02-12T10:00:00Z"
}
```

**⚠️ Important:** The full API key is only shown once during creation. Store it securely.

### List API Keys

**GET** `/api/projects/:projectId/api-keys`

Query Parameters:
- `skip` (number): Pagination offset
- `take` (number): Items per page
- `isActive` (boolean): Filter by active status
- `search` (string): Search by name

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "CI/CD Pipeline Key",
      "keyPreview": "ttk_live_...9c8d",
      "scopes": ["test:read", "test:execute"],
      "isActive": true,
      "lastUsedAt": "2024-02-12T15:30:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ],
  "total": 5
}
```

### Get API Key

**GET** `/api/projects/:projectId/api-keys/:keyId`

Response: (Full key hash not included for security)

### Update API Key

**PATCH** `/api/projects/:projectId/api-keys/:keyId`

Request:
```json
{
  "name": "Updated CI Key",
  "scopes": ["test:read", "test:execute", "bug:read"]
}
```

Response: `200 OK`

### Revoke API Key

**POST** `/api/projects/:projectId/api-keys/:keyId/revoke`

Response: `200 OK`

### Regenerate API Key

**POST** `/api/projects/:projectId/api-keys/:keyId/regenerate`

Response:
```json
{
  "key": "ttk_live_b4e8d90e5f3c2g7b0d9f4e3g2b1c0d9e"
}
```

### Get API Key Stats

**GET** `/api/projects/:projectId/api-keys/:keyId/stats`

Response:
```json
{
  "totalRequests": 1523,
  "successRate": 98.5,
  "lastUsedAt": "2024-02-12T15:30:00Z",
  "usageByDay": []
}
```

## Search

### Global Search

**GET** `/api/search`

Query Parameters:
- `projectId` (required): Project ID
- `q` (required): Search query (min 2 chars)
- `types` (string): Comma-separated types (TEST_CASE, BUG, EXECUTION)
- `skip` (number): Pagination offset
- `take` (number): Results per page

Response:
```json
{
  "results": [
    {
      "id": 15,
      "type": "TEST_CASE",
      "title": "User Login Flow",
      "description": "Verify user can login with valid credentials",
      "relevance": 0.95,
      "highlights": ["User <em>Login</em> Flow"]
    },
    {
      "id": 8,
      "type": "BUG",
      "title": "Login button not clickable",
      "severity": "HIGH",
      "status": "OPEN",
      "relevance": 0.87
    }
  ],
  "total": 24,
  "searchTime": 45
}
```

### Search Suggestions

**GET** `/api/search/suggestions`

Query Parameters:
- `projectId` (required): Project ID
- `q` (string): Partial query for autocomplete
- `types` (string): Resource types to search

Response:
```json
{
  "suggestions": [
    "User Login Flow",
    "Login button functionality",
    "Login validation tests"
  ]
}
```

### Rebuild Search Index

**POST** `/api/search/rebuild/:projectId`

*Admin only*

Response:
```json
{
  "success": true,
  "indexed": {
    "testCases": 150,
    "bugs": 45,
    "executions": 320
  },
  "duration": 2300
}
```

## Notifications

### List Notifications

**GET** `/api/notifications`

Query Parameters:
- `isRead` (boolean): Filter by read status
- `type` (string): Filter by notification type
- `sourceType` (string): TEST_CASE, BUG, EXECUTION, etc.
- `skip` (number): Pagination offset
- `take` (number): Items per page

Response:
```json
{
  "data": [
    {
      "id": 1,
      "type": "BUG_ASSIGNED",
      "title": "Bug assigned to you",
      "message": "Bug #BUG-42 has been assigned to you",
      "sourceType": "BUG",
      "sourceId": 42,
      "isRead": false,
      "createdAt": "2024-02-12T15:30:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 5
}
```

### Get Notification

**GET** `/api/notifications/:id`

Response: Single notification object

### Mark as Read

**PATCH** `/api/notifications/:id/read`

Response: `200 OK`

### Mark All as Read

**PATCH** `/api/notifications/mark-all-read`

Response:
```json
{
  "success": true,
  "updated": 12
}
```

### Delete Notification

**DELETE** `/api/notifications/:id`

Response: `204 No Content`

### Get Notification Preferences

**GET** `/api/notifications/preferences`

Response:
```json
{
  "email": {
    "enabled": true,
    "digest": "DAILY",
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  },
  "inApp": {
    "enabled": true
  },
  "channels": {
    "BUG_ASSIGNED": { "email": true, "inApp": true },
    "TEST_COMPLETED": { "email": false, "inApp": true }
  }
}
```

### Update Notification Preferences

**PATCH** `/api/notifications/preferences`

Request:
```json
{
  "email": {
    "enabled": true,
    "digest": "WEEKLY"
  },
  "channels": {
    "BUG_ASSIGNED": { "email": true, "inApp": true }
  }
}
```

Response: `200 OK`

## Scheduled Reports

### Create Scheduled Report

**POST** `/api/projects/:projectId/scheduled-reports`

Request:
```json
{
  "name": "Weekly Test Summary",
  "type": "EXECUTION_SUMMARY",
  "frequency": "WEEKLY",
  "dayOfWeek": 1,
  "time": "09:00",
  "timezone": "America/New_York",
  "recipientEmails": ["team@example.com"],
  "includeMetrics": true,
  "includeCharts": true,
  "includeFailures": true
}
```

Response: `201 Created`

### List Scheduled Reports

**GET** `/api/projects/:projectId/scheduled-reports`

Query Parameters:
- `skip`, `take` (pagination)
- `isActive` (boolean): Filter by active status

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Weekly Test Summary",
      "type": "EXECUTION_SUMMARY",
      "frequency": "WEEKLY",
      "isActive": true,
      "lastRunAt": "2024-02-12T09:00:00Z",
      "nextRunAt": "2024-02-19T09:00:00Z"
    }
  ],
  "total": 3
}
```

### Get Scheduled Report

**GET** `/api/projects/:projectId/scheduled-reports/:reportId`

Response: Full report details including delivery history

### Update Scheduled Report

**PATCH** `/api/projects/:projectId/scheduled-reports/:reportId`

Request:
```json
{
  "frequency": "BIWEEKLY",
  "isActive": false
}
```

Response: `200 OK`

### Delete Scheduled Report

**DELETE** `/api/projects/:projectId/scheduled-reports/:reportId`

Response: `204 No Content`

### Trigger Report Now

**POST** `/api/projects/:projectId/scheduled-reports/:reportId/send`

Response:
```json
{
  "success": true,
  "sentTo": ["team@example.com"],
  "sentAt": "2024-02-12T10:30:00Z"
}
```

## Direct Messages

### Get DM Contacts

**GET** `/api/dm/contacts`

Response:
```json
{
  "contacts": [
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "TESTER",
      "picture": "https://...",
      "isOnline": true
    }
  ]
}
```

### Get DM Conversation

**GET** `/api/dm/:userId/messages`

Query Parameters:
- `limit` (number): Max messages (1-100, default: 50)

Response:
```json
{
  "messages": [
    {
      "id": 1,
      "senderId": 1,
      "recipientId": 2,
      "content": "Hi, can you review this test case?",
      "isRead": true,
      "createdAt": "2024-02-12T10:15:00Z",
      "sender": {
        "id": 1,
        "name": "John Doe"
      }
    }
  ]
}
```

### Send DM

**POST** `/api/dm/:userId/send`

Request:
```json
{
  "content": "Hi, can you review this test case?"
}
```

Response: `201 Created`

### Get DM Conversations

**GET** `/api/dm/conversations`

Response:
```json
{
  "conversations": [
    {
      "userId": 2,
      "userName": "Jane Smith",
      "lastMessage": "Thanks for the review!",
      "lastMessageAt": "2024-02-12T15:30:00Z",
      "unreadCount": 3
    }
  ]
}
```

### Mark DM as Read

**POST** `/api/dm/:userId/mark-read`

Response: `200 OK`

### Add DM Reaction

**POST** `/api/dm/messages/:messageId/react`

Request:
```json
{
  "emoji": "👍"
}
```

Response: `200 OK`

### Edit DM

**PATCH** `/api/dm/messages/:messageId`

Request:
```json
{
  "content": "Updated message content"
}
```

Response: `200 OK`

### Delete DM

**DELETE** `/api/dm/messages/:messageId`

Response: `204 No Content`

## Channels

### Create Channel

**POST** `/api/channels`

Request:
```json
{
  "name": "qa-team",
  "description": "QA team discussions",
  "type": "GROUP",
  "isPrivate": false,
  "allowedRoles": ["ADMIN", "TESTER"]
}
```

Response: `201 Created`

### List Channels

**GET** `/api/channels`

Query Parameters:
- `type` (string): GROUP, DIRECT, PROJECT
- `includeArchived` (boolean): Include archived channels

Response:
```json
{
  "channels": [
    {
      "id": 1,
      "name": "qa-team",
      "description": "QA team discussions",
      "type": "GROUP",
      "memberCount": 15,
      "unreadCount": 3,
      "lastMessage": {
        "content": "See you tomorrow!",
        "timestamp": "2024-02-12T17:30:00Z"
      }
    }
  ]
}
```

### Get Channel

**GET** `/api/channels/:channelId`

Response: Full channel details with members

### Update Channel

**PATCH** `/api/channels/:channelId`

Request:
```json
{
  "description": "Updated description",
  "isArchived": false
}
```

Response: `200 OK`

### Delete Channel

**DELETE** `/api/channels/:channelId`

Response: `204 No Content`

### Get Channel Messages

**GET** `/api/channels/:channelId/messages`

Query Parameters:
- `limit` (number): Messages per page
- `before` (string): Message ID for pagination

Response:
```json
{
  "messages": [
    {
      "id": 1,
      "channelId": 1,
      "userId": 2,
      "content": "Hello team!",
      "createdAt": "2024-02-12T10:00:00Z",
      "user": {
        "id": 2,
        "name": "Jane Smith"
      }
    }
  ]
}
```

### Send Channel Message

**POST** `/api/channels/:channelId/messages`

Request:
```json
{
  "content": "Hello team!"
}
```

Response: `201 Created`

### Join Channel

**POST** `/api/channels/:channelId/join`

Response: `200 OK`

### Leave Channel

**POST** `/api/channels/:channelId/leave`

Response: `200 OK`

### Add Member to Channel

**POST** `/api/channels/:channelId/members`

Request:
```json
{
  "userId": 5
}
```

Response: `200 OK`

### Remove Member from Channel

**DELETE** `/api/channels/:channelId/members/:userId`

Response: `204 No Content`

## GitHub Integration

### Start OAuth Flow

**GET** `/api/github/oauth/authorize`

Query Parameters:
- `projectId` (required): Project ID
- `redirectUrl` (optional): Custom redirect URL

Response:
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?client_id=...",
  "state": "csrf_token_here"
}
```

### OAuth Callback

**POST** `/api/github/oauth/callback`

Request:
```json
{
  "code": "oauth_code_from_github",
  "state": "csrf_token_here",
  "projectId": 1,
  "repositoryUrl": "https://github.com/org/repo"
}
```

Response:
```json
{
  "success": true,
  "integration": {
    "id": 1,
    "projectId": 1,
    "repositoryUrl": "https://github.com/org/repo",
    "isActive": true
  }
}
```

### Get GitHub Integration

**GET** `/api/projects/:projectId/github/integration`

Response:
```json
{
  "id": 1,
  "projectId": 1,
  "repositoryUrl": "https://github.com/org/repo",
  "owner": "org",
  "repo": "repo",
  "isActive": true,
  "webhookId": "12345",
  "lastSyncAt": "2024-02-12T15:00:00Z"
}
```

### Update GitHub Integration

**PATCH** `/api/projects/:projectId/github/integration`

Request:
```json
{
  "repositoryUrl": "https://github.com/org/new-repo",
  "isActive": true
}
```

Response: `200 OK`

### Delete GitHub Integration

**DELETE** `/api/projects/:projectId/github/integration`

Response: `204 No Content`

### Get Recent Commits

**GET** `/api/projects/:projectId/github/commits`

Query Parameters:
- `limit` (number): Number of commits (default: 20)
- `branch` (string): Branch name (default: main)

Response:
```json
{
  "commits": [
    {
      "sha": "a3f7c89d4e2b1f6a9c8e3d2f1a0b9c8d7e6f5a4",
      "message": "Fix login validation issue",
      "author": "John Doe",
      "authorEmail": "john@example.com",
      "timestamp": "2024-02-12T14:30:00Z",
      "url": "https://github.com/org/repo/commit/a3f7c89"
    }
  ]
}
```

### Sync GitHub Data

**POST** `/api/projects/:projectId/github/sync`

Response:
```json
{
  "success": true,
  "synced": {
    "commits": 50,
    "branches": 3,
    "pullRequests": 5
  }
}
```

### GitHub Webhook Handler

**POST** `/api/github/webhook/:projectId`

*Automatically called by GitHub. Requires webhook secret verification.*

Handles events:
- `push`: New commits
- `pull_request`: PR opened/closed/merged
- `ping`: Webhook test

Response: `200 OK`