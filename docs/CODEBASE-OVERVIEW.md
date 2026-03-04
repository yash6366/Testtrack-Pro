# TestTrack Pro - Codebase Overview

> **Doc sync note (2026-03-04):** Updated with Bug History, Webhooks, Direct Messaging, and Chat Enhancement features.

Comprehensive analysis and structure guide for developers working on TestTrack Pro.

**Document Version**: 1.1  
**Last Updated**: March 4, 2026  
**Codebase Version**: 0.6.3 (Production-Ready)

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
| **Total Files** | 260+ |
| **Routes** | 27 route modules |
| **Services** | 37 service files |
| **Frontend Pages** | 41+ page components |
| **Frontend Components** | 75+ reusable components |
| **Database Models** | 60+ Prisma models (User, Project, TestCase, Execution, Bug, Channel, Webhook, DirectMessage, etc.) |
| **Database Migrations** | 21 completed migrations |
| **Test Coverage** | 70%+ |
| **Lines of Documentation** | 6500+ |

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

### 35 Services Organized by Domain

#### Authentication & Authorization (3)
- **`authService.js`** (400+ lines)
  - User signup with email verification
  - Login with JWT token generation and refresh
  - Password reset workflow with secure tokens
  - Token refresh with rotation strategy
  - OAuth 2.0 provider integration (Google, GitHub)
  - Session management with token versioning

- **`oauthService.js`** 
  - OAuth provider setup and validation
  - Google OAuth configuration handling
  - GitHub OAuth configuration handling
  - Token exchange and user linking

- **`userProfileService.js`**
  - User profile retrieval and updates
  - Public profile access
  - User statistics (assigned tests, bugs fixed, etc.)
  - Profile picture management

#### Test Management (5)
- **`testCaseService.js`** (1000+ lines)
  - Create, read, update, soft-delete test cases
  - Version history and change tracking
  - Test case assignment and ownership
  - Bulk import/export with CSV/Excel support
  - Test case cloning and templates
  - Archive and restore functionality

- **`testSuiteService.js`** (800+ lines)
  - Suite creation with hierarchical organization
  - Suite-to-testcase mapping and reordering
  - Suite execution tracking
  - Dynamic suite evaluation
  - Suite cloning and bulk operations
  - Parent-child suite relationships

- **`testPlanService.js`** (300+ lines)
  - Test plan creation and lifecycle management
  - Test case assignment to plans
  - Plan execution tracking
  - Plan cloning and templates
  - Execution report generation

- **`testCaseTemplateService.js`** (400+ lines)
  - Reusable test case templates with default fields
  - Template management (create, update, delete)
  - Template instantiation for new test cases
  - Public/private template scoping

- **`bulkTestCaseService.js`**
  - Bulk import from CSV with validation
  - Bulk export with formatting options
  - Batch operations on multiple test cases
  - Data validation before import

#### Test Execution (2)
- **`testRunCreationService.js` (implicit in testRuns route)**
  - Test run creation and setup
  - Test case selection for runs
  - Execution environment configuration

- **`testSuiteExecutionService.js`** (600+ lines)
  - Suite run creation and execution
  - Suite execution metrics calculation
  - Suite execution trends and analytics
  - Suite run comparison
  - Execution report generation

#### Bug/Defect Management (3)
- **`bugService.js`** (1200+ lines)
  - Bug creation from test failures
  - Status workflow management (NEW, ASSIGNED, IN_PROGRESS, FIXED, VERIFIED, CLOSED)
  - Fix documentation (V1 NEW FEATURE) with root cause analysis
  - Bug comments and real-time discussions
  - Retest request workflow with reassignment
  - Unique bug number generation
  - Bug filtering and searching

- **`developerService.js`** (200+ lines)
  - Developer-specific analytics for fix patterns
  - Fix metrics and productivity trends
  - Assigned bug tracking and stats
  - Performance insights per developer

- **`commitParserService.js`**
  - Auto-link commits to bugs via patterns
  - Multiple regex pattern matching
  - GitHub commit data parsing
  - Integration with GitHub webhooks

#### Analytics & Reporting (4)
- **`analyticsService.js`** (800+ lines)
  - Execution trend analysis (8-week history)
  - Flaky test detection and rate calculation
  - Bug trend tracking and velocity
  - Execution speed metrics per test
  - Bug age analysis and SLA tracking
  - Tester performance comparison
  - Test coverage calculation

- **`reportService.js`** (400+ lines)
  - Execution report generation with detailed metrics
  - Tester performance reports
  - Defect analysis with categorization
  - CSV and PDF export formats
  - Project-wide metrics aggregation

- **`scheduledReportService.js`** (300+ lines)
  - Report scheduling with cron syntax
  - Email delivery of scheduled reports
  - Report template management
  - Digest frequency configuration

- **`searchIndexService.js`** (400+ lines)
  - Full-text search index maintenance
  - Search index creation for test cases
  - Search index creation for bugs
  - Search index creation for executions
  - Index rebuild and optimization

#### Communication (5)
- **`notificationService.js`** (600+ lines)
  - Notification creation and routing
  - Smart delivery strategy based on user preferences
  - User notification preferences management
  - Digest scheduling for email batching
  - Real-time vs. batched delivery options

- **`notificationEmitter.js`** (1000+ lines)
  - Real-time WebSocket emission via Socket.IO
  - Socket.IO room management by project/type
  - Event streaming for live updates
  - Delivery confirmation and acknowledgment

- **`channelService.js`** (600+ lines)
  - Channel creation and management
  - Role-based auto-join (ADMIN, DEVELOPER, TESTER channels)
  - Universal channel setup
  - Member management and permissions
  - Channel message moderation

- **`chatAdminService.js`** (200+ lines)
  - User muting functionality with duration
  - Message deletion and hard-delete by admins
  - Channel locking and disabling
  - Moderation audit logging

- **`digestService.js`**
  - Email digest compilation and formatting
  - Multiple notification batching
  - Digest template rendering
  - Schedule-based digest delivery

#### File & Evidence Management (2)
- **`evidenceService.js`** (300+ lines)
  - File upload handling to Cloudinary
  - Size validation and optimization
  - Evidence linking to test executions
  - Evidence gallery and viewer support
  - Metadata tracking (upload time, uploader, etc.)

- **`exportService.js`**
  - Test case export to CSV/Excel/PDF
  - Report export with formatting
  - Bulk data export functionality

#### Integrations (4)
- **`webhookService.js`** (400+ lines)
  - Webhook registration and management
  - Event trigger configuration (TEST_EXECUTION, BUG_CREATED, etc.)
  - Retry policies with exponential backoff
  - Webhook delivery tracking and history
  - Test webhook delivery

- **`webhookHandlerService.js`** (360+ lines)
  - Webhook payload processing and validation
  - Push event handling for GitHub
  - Pull request event handling
  - Commit data syncing
  - Webhook event routing

- **`githubService.js`** (400+ lines)
  - GitHub OAuth flow implementation
  - Pull request metadata fetching
  - Commit linking and parsing
  - Repository integration

- **`searchService.js`** (350+ lines)
  - Global search across test cases, bugs, executions
  - Search with filters and advanced queries
  - Search suggestions and autocomplete
  - Recent searches tracking

#### Infrastructure & Admin (5)
- **`emailService.js`** (300+ lines)
  - Email template rendering with variables
  - Resend API integration
  - Verification email workflow
  - Password reset email sending
  - Notification email dispatch

- **`apiKeyService.js`** (200+ lines)
  - API key generation and management
  - Key validation and scoping
  - Rate limit configuration per key
  - Key rotation functionality

- **`userSessionService.js`** (150+ lines)
  - User session tracking and management
  - Session details retrieval
  - Session revocation (single and all)
  - Session statistics per user

- **`cronService.js`** (400+ lines)
  - Background job scheduling
  - node-cron integration
  - Job execution management
  - Scheduled report execution
  - Failed delivery retry jobs

- **`adminProjectService.js`** (250+ lines)
  - Project creation and management
  - User allocation to projects
  - Project-level role assignment
  - Project member management

#### Utilities (5 in lib/)
- **`auditService.js`** (400+ lines)
  - Audit log creation for all operations
  - Audit log retrieval and filtering
  - Change tracking and comparison
  - Admin audit log access

- **`logger.js`** (293 lines)
  - Structured JSON logging with Sentry integration
  - Log levels (info, warn, error, debug)
  - Context preservation across requests
  - Request correlation IDs

- **`socket.js`** (1000+ lines)
  - Socket.IO server setup and configuration
  - Room management by project and entity type
  - Event handling and broadcasting
  - Real-time delivery tracking

- **`validation.js`**
  - Input validation helpers with Zod
  - Schema definitions for all endpoints
  - Request body validation middleware

- **`sanitization.js`**
  - HTML/SQL sanitization
  - XSS prevention
  - User input cleaning

---

## Frontend Structure

### Pages (41+ total)

**Core Pages:**
- `Dashboard.jsx` - Main dashboard with KPIs
- `Home.jsx` - Landing page for unauthenticated users
- `Login.jsx`, `ResetPasswordModal.jsx` - Authentication UI
- `Signup.jsx`, `VerifyEmail.jsx` - Registration workflow
- `ProfilePage.jsx` - User profile with edit capability

**Test Management:**
- `ProjectTestCasesPage.jsx` - List and create test cases
- `TestCaseDetailPage.jsx` - View/edit single test case with version history
- `TestSuiteDetailPage.jsx` - Suite management with test case reordering
- `TestSuitesPage.jsx` - List test suites with hierarchy view
- `TemplateManagementPage.jsx` - Manage test case templates
- `TestPlanDetailPage.jsx` - View and manage test plans
- `TestPlansPage.jsx` - List all test plans

**Test Execution:**
- `TestRunCreation.jsx` - Create new test run
- `TestRunDetailPage.jsx` - View test run results and analytics
- `TestExecution.jsx` - Main test execution UI with step-by-step navigation
- `TestExecutionSummary.jsx` - Execution results and metrics

**Bug Management:**
- `BugsPage.jsx` - Bug listing with advanced filters
- `BugDetailsPage.jsx` - Detailed bug view with comments
- `BugCreationForm.jsx` - Inline bug creation form
- `EvidenceGalleryPage.jsx` - Evidence/screenshot viewer

**Analytics & Reporting:**
- `AnalyticsDashboard.jsx` - Main analytics with charts and trends
- `ReportsPage.jsx` - Reports and exports
- `ScheduledReportsPage.jsx` - Scheduled report management
- `dashboards/` folder - Multiple analytical dashboards

**Communication:**
- `Chat.jsx` - Main channel messaging interface
- `NotificationsPage.jsx` - Notification center and history

**Admin & Settings:**
- `AdminPanelPage.jsx` - Admin controls and management
- `AdminUserDetailPage.jsx` - User management interface
- `SettingsPage.jsx` - User preferences and settings
- `AuditLogsPage.jsx` - Audit log viewer for compliance
- `MilestonesPage.jsx` - Milestone management

**Integrations:**
- `WebhooksPage.jsx` - Webhook management and testing
- `IntegrationsPage.jsx` - Third-party integrations
- `ApiKeysPage.jsx` - API key management
- `OAuthCallback.jsx` - OAuth redirect handler
- `SuiteRunDetailPage.jsx` - Test suite execution results

### Components (75+ total)

**Forms & Modals:**
- `BugCreationModal.jsx` - Bug creation dialog
- `BugDetailsModal.jsx` - Bug details read-only popup
- `ChangePasswordModal.jsx` - Password change dialog
- `ForgotPasswordModal.jsx` - Password reset dialog
- `FixDocumentationModal.jsx` - Fix documentation form with metadata
- `MilestoneDetailsModal.jsx` - Milestone details popup

**Test Management:**
- `TestCaseManagement.jsx` - Comprehensive test case editor
- `TestCaseDetailsView.jsx` - TC detail viewer
- `TestCaseImportModal.jsx` - Bulk import with preview
- `BulkTestCaseOperations.jsx` - Batch operations on multiple TCs
- `TestCaseTemplateManagement.jsx` - Template editor
- `TestCaseTemplateSelector.jsx` - Template selection for new TCs

**Execution:**
- `StepNavigator.jsx` - Step-by-step execution navigation
- `ActualResultInput.jsx` - Result input with rich text
- `ExecutionTimer.jsx` - Timer for test execution
- `ExecutionTrendChart.jsx` - Chart visualization of trends
- `TestExecutionComments.jsx` - Comments during execution

**Chat & Collaboration:**
- `ChatLayout.jsx` - Main chat UI structure
- `ChatSidebar.jsx` - Channel and user list
- `ChatWithSidebar.jsx` - Chat wrapper component
- `DirectMessagesPanel.jsx` - DM list and management
- `DirectMessageWindow.jsx` - DM conversation interface
- `CommentInput.jsx` - Comment box component
- `CommentThread.jsx` - Discussion thread viewer
- `ChatAdminControls.jsx` - Moderation UI
- `RealtimeDiscussionModal.jsx` - Real-time discussion modal
- `OnlineUsersPanel.jsx` - Active users display

**Defect Tracking:**
- `BugDiscussion.jsx` - Bug comment thread
- `BugsList.jsx` - Paginated bugs listing
- `DefectAssignmentModal.jsx` - Bug assignment UI
- `RequestRetestModal.jsx` - Retest request dialog
- `FixDocumentationView.jsx` - View fix documentation

**Analytics:**
- Multiple chart components in `components/charts/` folder
- `MetricsGrid.jsx` - KPI display grid
- `DeveloperMetricsPanel.jsx` - Developer statistics
- `DeveloperReports.jsx` - Developer performance reports
- `DeveloperNotifications.jsx` - Developer-specific alerts
- `ExecutionTrendChart.jsx` - Execution trend visualization

**Admin & Moderation:**
- `AdminAnnouncements.jsx` - System announcements
- `AuditLogViewer.jsx` - Audit log display
- `BackupManagement.jsx` - Backup controls
- `ChannelStatusOverlay.jsx` - Channel status display

**Common/UI:**
- `DashboardLayout.jsx` - App shell and layout
- `ProjectSelector.jsx` - Project picker dropdown
- `GlobalSearch.jsx` - Global search interface
- `ErrorBoundary.jsx` - Error handling wrapper
- `NotificationCenter.jsx` - Notification management
- `NotificationToast.jsx` - Toast notification display
- `NotificationPreferences.jsx` - Notification settings
- `MuteBanner.jsx` - Mute status banner
- `ThemeToggle.jsx` - Dark/light mode toggle
- `VirtualizedTable.jsx` - Virtualized list for performance
- `LoginForm.jsx` - Login form component
- `SignupForm.jsx` - Signup form component
- `OAuthButtons.jsx` - OAuth provider buttons
- `ProjectManagement.jsx` - Project CRUD operations
- `AdvancedFiltersPanel.jsx` - Advanced filter controls
- `SavedViewsDashboard.jsx` - Saved filter views
- `WebhookManagement.jsx` - Webhook CRUD
- `VersionHistoryModal.jsx` - Test case version history
- `CommitSelector.jsx` - Git commit selector for bug fixes  
- `EnhancedTestCaseManagement.jsx` - Advanced TC editor
- `UserProfileService.jsx` - Helper for user data
- plus utility and common UI components in `ui/` folder

### Hooks (15+ custom hooks)

- **`useAuth.js`** - Authentication context and login state
- **`useProject.js`** - Project selection and context
- **`useBug.js`** - Bug operations and state
- **`useTestExecution.js`** - Test execution state management
- **`useNotifications.js`** - Notification context and real-time updates
- **`useChat.js`** - Chat and messaging state
- **`useAnalytics.js`** - Analytics data fetching
- **`usePagination.js`** - Pagination state management
- **`useSearch.js`** - Global search functionality
- **`useSocket.js`** - Socket.IO connection management
- Plus additional utility hooks for forms, filters, and UI state

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
