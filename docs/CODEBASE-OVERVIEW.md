# TestTrack Pro - Codebase Overview

Comprehensive analysis and structure guide for developers working on TestTrack Pro.

**Document Version**: 1.0  
**Last Updated**: February 24, 2026  
**Codebase Version**: 0.6.2 (Production-Ready)

## Quick Navigation

- [Project Statistics](#project-statistics)
- [Architecture Layers](#architecture-layers)
- [Service Layer Guide](#service-layer-guide)
- [Frontend Structure](#frontend-structure)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Real-time Communication](#real-time-communication)
- [Key Patterns](#key-patterns)

---

## Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 200+ |
| **Routes** | 23 route modules |
| **Services** | 32 service files |
| **Frontend Pages** | 38 page components |
| **Frontend Components** | 65+ reusable components |
| **Database Models** | 50+ Prisma models |
| **Database Migrations** | 13 completed migrations |
| **Test Coverage** | 70%+ |
| **Lines of Documentation** | 5000+ |

---

## Architecture Layers

```
┌──────────────────────────────────────┐
│     React SPA Frontend (Vite)        │
│  - 38 Pages, 65+ Components          │
│  - Socket.IO Client Integration      │
│  - React Context + Hooks State Mgmt  │
└────────────────┬─────────────────────┘
                 │ HTTP/REST + WebSocket
┌────────────────▼─────────────────────┐
│    Fastify API Gateway (Node.js)     │
│  - JWT Authentication                │
│  - RBAC Authorization                │
│  - Rate Limiting & CORS               │
│  - Swagger/OpenAPI Docs              │
│  - Socket.IO Real-time Server        │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│    23 Route Modules (Business Logic) │
│  - Auth, Tests, Bugs, Analytics      │
│  - Chat, Webhooks, Integrations      │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│    32 Service Modules (Domain Logic) │
│  - testCaseService                   │
│  - bugService                        │
│  - analyticsService                  │
│  - And 29 more...                    │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│    Prisma ORM (Data Abstraction)     │
│  - 50+ Models                        │
│  - Type-safe queries                 │
│  - Auto migrations                   │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│    PostgreSQL Database (Primary)     │
│  - Persistent data storage           │
│  - Full ACID guarantees              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    Supporting Services               │
│  - Redis (Cache, Pub-Sub)            │
│  - Cloudinary (File Storage)         │
│  - Resend (Email Service)            │
│  - Sentry (Error Monitoring)         │
└──────────────────────────────────────┘
```

---

## Service Layer Guide

### 32 Services Organized by Domain

#### Authentication & Authorization (3)
- **`authService.js`** (280 lines)
  - User signup with email verification
  - Login with JWT token generation
  - Password reset workflow
  - Token refresh with rotation
  - OAuth integration setup

- **`rbac.js`** (256 lines) - Library, not service
  - JWT token verification
  - Role extraction from tokens
  - Token version validation (invalidation)
  - User loading from database

- **`permissions.js`** - Permission matrix definition
  - ADMIN, DEVELOPER, TESTER, GUEST roles
  - Granular permission definitions
  - Permission checker implementation

#### Test Management (4)
- **`testCaseService.js`**
  - Create, read, update, soft-delete test cases
  - Version history tracking
  - Test case templates
  - Bulk import/export

- **`testSuiteService.js`**
  - Suite creation and hierarchy
  - Suite-to-testcase mapping
  - Suite execution tracking

- **`testPlanService.js`**
  - Test plan creation and lifecycle
  - Test case assignment to plans
  - Plan execution tracking

- **`testCaseTemplateService.js`**
  - Reusable test case templates
  - Public/private templates
  - Template instantiation

#### Test Execution (2)
- **`testCasePermissions.js`**
  - Resource-level access control
  - Step visibility based on user role

- **`bulkTestCaseService.js`**
  - Bulk import from CSV/Excel
  - Bulk export with formatting
  - Batch operations

#### Bug/Defect Management (3)
- **`bugService.js`** (1000+ lines)
  - Bug creation from test failures
  - Status workflow management
  - Fix documentation (V1 NEW)
  - Bug comments and discussions
  - Retest request workflow
  - Unique bug number generation

- **`developerService.js`**
  - Developer-specific analytics
  - Fix metrics and trends
  - Assigned bug tracking
  - Performance insights

- **`commitParserService.js`**
  - Auto-link commits to bugs
  - Multiple pattern matching
  - GitHub integration

#### Analytics & Reporting (4)
- **`analyticsService.js`**
  - Execution trend analysis (8-week)
  - Flaky test detection
  - Bug trend tracking
  - Execution speed metrics
  - Bug age analysis
  - Tester comparison

- **`reportService.js`**
  - Report generation
  - Multiple export formats
  - Scheduled reporting

- **`scheduledReportService.js`**
  - Cron job scheduling
  - Email digest generation
  - Report distribution

- **`searchIndexService.js`**
  - Search index maintenance
  - Full-text search optimization

#### Communication (4)
- **`notificationService.js`**
  - Notification creation
  - Smart delivery strategy
  - User preferences
  - Digest scheduling

- **`notificationEmitter.js`**
  - Real-time WebSocket emission
  - Socket.IO room management
  - Delivery tracking

- **`channelService.js`**
  - Channel creation and management
  - Role-based auto-join
  - Universal channel setup
  - Member management

- **`chatAdminService.js`**
  - User muting functionality
  - Message deletion by admins
  - Channel locking/disabling
  - Moderation audit logs

#### File & Evidence Management (2)
- **`evidenceService.js`**
  - File upload to Cloudinary
  - Size validation and optimization
  - Evidence linking to executions

- **`cloudinary.js`** - Utility (not service)
  - Cloudinary API client
  - Upload configuration
  - URL generation

#### Integrations (4)
- **`webhookService.js`**
  - Webhook creation
  - Event trigger management
  - Retry policies

- **`webhookHandlerService.js`**
  - Webhook payload processing
  - Event routing

- **`githubService.js`**
  - GitHub OAuth flow
  - PR metadata fetching
  - Commit linking

- **`oauthService.js`**
  - OAuth provider integration
  - Google & GitHub setup
  - Token exchange

#### Infrastructure (4)
- **`emailService.js`**
  - Email template rendering
  - Resend API integration
  - Verification email sending
  - Password reset emails

- **`apiKeyService.js`**
  - API key generation
  - Key validation
  - Scope checking
  - Rotation functionality

- **`cacheService.js`**
  - Redis caching layer
  - Cache invalidation
  - Session storage

- **`cronService.js`**
  - Background job scheduling
  - node-cron integration
  - Job execution management

#### Admin Management (1)
- **`adminProjectService.js`**
  - Project creation and management
  - User allocation to projects
  - Project-level role assignment

#### Utilities & Helpers (5 in lib/)
- **`logger.js`** (293 lines)
  - Structured JSON logging
  - Log levels (info, warn, error, debug)
  - Context preservation

- **`socket.js`** (1000+ lines)
  - Socket.IO server setup
  - Room management
  - Event handling
  - Delivery tracking

- **`prisma.js`**
  - Singleton Prisma client
  - Connection pooling

- **`validation.js`**
  - Input validation helpers
  - Zod integration

- **`sanitization.js`**
  - HTML/SQL sanitization
  - XSS prevention

---

## Frontend Structure

### Pages (38 total)

**Core Pages:**
- `Dashboard.jsx` - Main dashboard
- `Home.jsx` - Landing page
- `Login.jsx`, `Signup.jsx` - Authentication
- `ProfilePage.jsx` - User profile

**Test Management:**
- `ProjectTestCasesPage.jsx` - List and create test cases
- `TestCaseDetailPage.jsx` - View/edit single test case
- `TestSuiteDetailPage.jsx` - Suite management
- `TestSuitesPage.jsx` - List suites
- `TemplateManagementPage.jsx` - Manage templates

**Test Execution:**
- `TestRunCreation.jsx` - Create new test run
- `TestRunDetailPage.jsx` - View test run results
- `TestExecution.jsx` - Main test execution UI
- `TestExecutionSummary.jsx` - Execution results

**Bug Management:**
- `BugsPage.jsx` - Bug listing with filters
- `BugDetailsPage.jsx` - Detailed bug view
- `BugCreationForm.jsx` - Create bug form
- `EvidenceGalleryPage.jsx` - Evidence viewer

**Analytics & Reporting:**
- `AnalyticsDashboard.jsx` - Main analytics dashboard
- `ReportsPage.jsx` - Reports and exports
- `ScheduledReportsPage.jsx` - Scheduled report management

**Communication:**
- `Chat.jsx` - Channel messaging interface

**Admin & Settings:**
- `AdminPanelPage.jsx` - Admin controls
- `AdminUserDetailPage.jsx` - User management
- `SettingsPage.jsx` - User settings
- `NotificationsPage.jsx` - Notification center
- `AuditLogsPage.jsx` - Audit log viewer

**Integrations:**
- `WebhooksPage.jsx` - Webhook management
- `IntegrationsPage.jsx` - Third-party integrations
- `ApiKeysPage.jsx` - API key management
- `OAuthCallback.jsx` - OAuth redirect handler

### Components (65+ total)

**Forms & Modals:**
- `BugCreationModal.jsx` - Bug creation dialog
- `BugDetailsModal.jsx` - Bug details popup
- `ChangePasswordModal.jsx` - Password change
- `ForgotPasswordModal.jsx` - Password reset
- `FixDocumentationModal.jsx` - Fix documentation form

**Test Management:**
- `TestCaseManagement.jsx` - Comprehensive TC editor
- `TestCaseDetailsView.jsx` - TC detail viewer
- `TestCaseImportModal.jsx` - Bulk import
- `BulkTestCaseOperations.jsx` - Batch operations

**Execution:**
- `StepNavigator.jsx` - Step-by-step UI
- `ActualResultInput.jsx` - Result input component
- `ExecutionTimer.jsx` - Execution timer
- `ExecutionTrendChart.jsx` - Chart visualization

**Chat & Collaboration:**
- `ChatLayout.jsx` - Main chat UI
- `ChatSidebar.jsx` - Channel list
- `DirectMessageWindow.jsx` - DM interface
- `CommentInput.jsx` - Comment box
- `CommentThread.jsx` - Discussion thread
- `ChatAdminControls.jsx` - Moderation UI

**Analytics:**
- Multiple chart components in `components/charts/`
- `MetricsGrid.jsx` - KPI display

**Common:**
- `DashboardLayout.jsx` - App shell
- `ProjectSelector.jsx` - Project picker
- `GlobalSearch.jsx` - Search interface
- `ErrorBoundary.jsx` - Error handling
- `LoadingState.jsx` - Skeleton loader

### Hooks (Custom)

- **`useAuth.js`** - Authentication context
- **`useProject.js`** - Project selection
- **`useBug.js`** - Bug operations
- **`useTestExecution.js`** - Execution state

### State Management

- **React Context API** - No Redux to minimize overhead
- **LocalStorage** - Persistent user prefs
- **Socket.IO Events** - Real-time updates
- **Component State** - Local component state

---

## Database Schema

### 50+ Models (Complete List)

#### Core (1)
- `User` - Authentication and profile

#### Projects (2)
- `Project` - Workspace organization
- `ProjectUserAllocation` - User assignment with roles
- `ProjectEnvironment` - Test environments

#### Test Cases (6)
- `TestCase` - Test specifications
- `TestCaseStep` - Step-by-step instructions
- `TestCaseVersion` - Change history
- `TestCaseCounter` - Unique ID generation
- `TestCaseTemplate` - Reusable templates
- `CustomField` - Project-specific fields

#### Test Execution (4)
- `TestRun` - Execution batch
- `TestExecution` - Individual test result
- `TestExecutionStep` - Step-level tracking
- `TestExecutionEvidence` - Attachments

#### Test Suites (3)
- `TestSuite` - Logical grouping
- `TestSuiteTestCase` - TC mapping
- `TestSuiteRun` - Suite execution

#### Test Plans (1)
- `TestPlan` - Planning and coordination

#### Bugs (3)
- `Bug` - Defect tracking
- `BugComment` - Discussion
- `BugRetestRequest` - Retest workflow
- `BugCounter` - Unique ID generation

#### Artifacts (1)
- `Milestone` - Release tracking

#### Communication (7)
- `Channel` - Group chats
- `ChannelMember` - Channel membership
- `ChannelMessage` - Chat messages
- `DirectMessage` - 1:1 conversations
- `MessageMention` - @mentions
- `MessageReaction` - Emoji reactions
- `PinnedMessage` - Important messages
- `ChatAuditLog` - Moderation log

#### Notifications (2)
- `Notification` - User notifications
- `NotificationPreference` - User settings

#### Security & Audit (4)
- `UserSession` - Multi-device tracking
- `AuditLog` - Action audit trail
- `UserActivityLog` - User behavior
- `OAuthIntegration` - OAuth connections

#### Integrations (2)
- `Webhook` - Custom webhooks
- `ApiKey` - Developer API keys

#### Search (1)
- `SearchIndex` - Full-text search

---

## API Routes

### 23 Route Modules

```
/api/auth/*              - Authentication (signup, login, refresh)
/api/tests/*             - Test case management
/api/test-runs/*         - Test run management
/api/executions/*        - Test execution tracking
/api/bugs/*              - Bug lifecycle
/api/analytics/*         - Dashboards and metrics
/api/projects/*          - Project management
/api/admin/*             - User and system admin
/api/tester/*            - Tester-specific features
/api/developer/*         - Developer workflows
/api/chat/*              - Channel messaging
/api/direct-message/*    - Direct messages
/api/channels/*          - Channel management
/api/notifications/*     - Notification handling
/api/webhooks/*          - Webhook management
/api/github/*            - GitHub integration
/api/evidence/*          - File uploads
/api/api-keys/*          - API key management
/api/scheduled-reports/* - Report scheduling
/api/test-suites/*       - Suite management
/api/milestones/*        - Milestone tracking
/api/search/*            - Full-text search
/api/health/*            - Health checks
```

---

## Real-time Communication

### Socket.IO Architecture

**Room Naming Convention:**
```
room:<roomId>          # For bug/test discussions
project:<projectId>    # Project-wide broadcasts
role:<role>            # Role-based notifications
user:<userId>          # Direct user notifications
```

**Emitted Events:**
- `testExecutionUpdated` - Step progress
- `bugStatusChanged` - Bug status change
- `messageReceived` - Chat message
- `notificationCreated` - New notification
- `chatAdminAction` - Moderation actions
- `userPresence` - Online/offline
- `commentAdded` - New comment

**Scaling:**
- Redis adapter for multi-server pub-sub
- Upstash Redis support for serverless
- Connection pooling
- Automatic reconnection with backoff

---

## Key Patterns

### 1. Service Layer Pattern

**Location**: `apps/api/src/services/*.js`

**How it works:**
```javascript
// Route calls service
async (request, reply) => {
  const result = await bugService.createBug(data, context);
  reply.send(result);
}

// Service handles business logic
export async function createBug(data, context) {
  // Validation
  // Database operation
  // Audit logging
  // Event emission
  return result;
}
```

### 2. RBAC Pattern

**Components:**
- Route guards: `requireAuth()`, `requireRoles()`, `requireProjectRole()`
- Permission checker: `requirePermission('bug:create')`
- User context: `request.user` with id, email, role

**Example:**
```javascript
fastify.post('/bugs', {
  preHandler: [requireAuth, requirePermission('bug:create')]
}, handler)
```

### 3. Permission Context Pattern

**Prevents direct service invocation:**
```javascript
// Routes create context
const context = {
  userId: request.user.id,
  action: 'bug:create',
  projectId: request.params.projectId
};

// Services require context
export function createBug(data, permissionContext) {
  if (!permissionContext) {
    throw new Error('Missing permission context');
  }
  // Safe to proceed
}
```

### 4. Audit Logging Pattern

**Automatic tracking of all changes:**
```javascript
// Service creates change
await prisma.bug.update({...});

// Automatically audit
await auditLog.create({
  userId: context.userId,
  action: 'BUG_UPDATED',
  resourceType: 'BUG',
  resourceId: bugId,
  oldValues: JSON.stringify(oldBug),
  newValues: JSON.stringify(newBug),
});
```

### 5. Soft Delete Pattern

**Preserve data integrity:**
```javascript
// Don't delete, mark deleted
await testCase.update({
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: userId
});

// Queries exclude deleted by default
where: { isDeleted: false }
```

### 6. Event Emission Pattern

**Real-time updates after changes:**
```javascript
// After creating bug
io.to(`project:${projectId}`).emit('bugCreated', {
  bugId: bug.id,
  bugNumber: bug.bugNumber,
  title: bug.title
});

// Notify assignee directly
io.to(`user:${bug.assignedToId}`).emit(
  'notificationCreated',
  { message: 'New bug assigned to you' }
);
```

### 7. Transaction Pattern (Serializable)

**Prevent race conditions:**
```javascript
// Use serializable transactions for critical operations
const result = await prisma.$transaction(
  async (tx) => {
    // Get next counter atomically
    const counter = await tx.bugCounter.update({
      where: { projectId },
      data: { nextNumber: { increment: 1 } }
    });
    
    // Create bug with guaranteed unique number
    const bug = await tx.bug.create({
      data: { bugNumber: `${key}-${counter.nextNumber}` }
    });
    
    return bug;
  },
  { isolationLevel: 'Serializable' }
);
```

---

## Development Workflow

### Adding a New Feature (Bug Fix Documentation in V1)

1. **Schema Change** (3 migrations created)
   - Add `fixStrategy`, `rootCauseAnalysis`, `rootCauseCategory` fields
   - Add fix documentation related fields

2. **Service Layer**
   - Extend `bugService.js` with `updateBugFixDocumentation()`
   - Handle validation, logging, event emission

3. **Route Handler**
   - Add `PATCH /api/projects/:projectId/bugs/:id/fix-documentation`
   - Permission check: `requirePermission('bug:edit')`

4. **Frontend Form**
   - Create `FixDocumentationModal.jsx`
   - Form fields matching API contract

5. **API Call**
   - Hook: `useBug()` with fix documentation method
   - Error handling and validation

6. **Real-time Update**
   - Socket.IO event: `bugFixDocumented`
   - Broadcast to relevant subscribers

---

## Troubleshooting Guide

### Common Issues

**Port in use:**
```bash
# Kill process
lsof -ti:3001 | xargs kill -9  # macOS/Linux
(Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process  # Windows
```

**Database connection:**
```bash
# Verify PostgreSQL running
psql -U postgres -h localhost -c "SELECT 1"
```

**Redis connection:**
```bash
# Test Redis
redis-cli ping  # Should return PONG
```

**JWT errors:**
```javascript
// Check token in browser console
const token = localStorage.getItem('token');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded); // Check exp, id, role
```

---

## Performance Considerations

### Caching Strategy
- Session data in Redis (5 min TTL)
- Notification badges cached (1 min)
- Analytics results cached (aggressive - 1 hour)

### Database Indexes
- Strategic indexes on frequently queried columns
- Composite indexes for common queries
- Regular ANALYZE for query optimization

### Pagination
- Default 50 items per page
- Cursor-based pagination for large datasets
- Virtual scrolling in UI for performance

### Connection Pooling
- Prisma manages PostgreSQL connection pool
- Redis connection reuse via ioredis

---

## Contributing Guidelines

Before submitting a PR:

1. **Code Quality**
   ```bash
   pnpm lint --fix    # Fix formatting
   pnpm test          # Run tests
   ```

2. **Database Changes**
   - Create migration: `pnpm prisma migrate dev --name description`
   - Commit migration files with code

3. **API Changes**
   - Update Swagger schema
   - Update API-REFERENCE.md

4. **Feature Tests**
   - Aim for 70%+ coverage
   - Test happy path + error cases

5. **Documentation**
   - JSDoc comments for functions
   - Update relevant docs

---

**Document maintained by**: Development Team  
**Last reviewed**: February 24, 2026
