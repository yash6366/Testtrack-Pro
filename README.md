# TestTrack Pro - Full-Stack Monorepo

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-org/testtrack-pro/actions)
[![Test Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)](./)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.6.2-blue)](./)

TestTrack Pro is a **production-ready**, full-stack software testing management platform that enables QA teams to manage the complete testing lifecycle in one place - from writing test cases to executing them, reporting bugs, tracking fixes, and generating analytics.

Think of it as a mini version of tools like **TestRail + Jira** with modern tech stack and enterprise-grade features.

## ✨ Key Features

- **📋 Test Case Management**: Create, organize, and review test cases with version control
- **🚀 Test Execution**: Execute test runs with real-time status tracking and live updates
- **🐛 Defect Tracking**: Report, assign, and track bugs with full lifecycle management
- **� Bug Fix Documentation** *(NEW V1)*: Developers document fixes with root cause analysis and git traceability
- **📊 Analytics Dashboard**: Monitor QA health with comprehensive metrics and trends
  - **Flaky Test Detection** *(NEW V1)*: Identify unreliable tests with inconsistent results
  - **Developer Analytics** *(NEW V1)*: Track developer fix patterns and productivity metrics
  - **Execution Trends**: 8-week pass rate and performance analysis
  - **Bug Velocity**: Monitor bug resolution rates and trends
- **💬 Real-time Communication**: Collaborate via comments and live notifications
- **👥 RBAC**: Role-based access control (Admin, Developer, Tester, Guest)
- **🔐 Enterprise Security**: JWT auth, encrypted data, RBAC, audit logging
- **📈 Production Ready**: 70%+ test coverage, error monitoring (Sentry), automated backups
- **⚡ High Performance**: Sub-second API responses, Smart caching with Redis
- **🔄 Real-time Updates**: Socket.IO for live test execution and notifications

## 🎉 What's New in V1

TestTrack Pro V1 introduces major enhancements for developer productivity and deeper quality insights:

### Bug Fix Documentation
- **Document Your Fixes**: Developers can now document how they fixed bugs with detailed metadata
- **Root Cause Analysis**: Classify bugs by root cause (Design Defect, Implementation Error, Config Issue, etc.)
- **Git Traceability**: Link fixes to commits, branches, and pull requests for full code traceability
- **Version Tracking**: Track fix hours and which version the fix was released in
- **Institutional Knowledge**: Build a knowledge base of common bug types and fix patterns

### Advanced Analytics
- **Flaky Test Detection**: Automatically identify tests with inconsistent results (marked as "flaky")
  - Calculates flake rates based on historical execution data
  - Helps prioritize test maintenance efforts
  - Supports configurable flake rate thresholds
- **Developer Analytics Dashboard**: Track developer productivity and fix patterns
  - Bugs fixed per week
  - Average fix time per developer
  - Root cause distribution for each developer
  - Identify which types of bugs take longest to fix
- **Execution Trends**: 8-week view of test pass rates and execution performance
- **Bug Velocity Tracking**: Monitor how quickly bugs are being fixed

### Developer Enhancements
- **Enhanced Developer Role**: Developers can now document fixes while maintaining security controls
- **Fix Verification Workflow**: Separation of duties - developers fix, testers verify
- **Performance Insights**: See your fix metrics and improvement areas
- **API Improvements**: New endpoints for all analytics features

---

```
testtrack-pro/
├── apps/
│   ├── api/                    # Fastify backend server (Node.js)
│   │   ├── src/
│   │   │   ├── server.js       # Main server entry
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic
│   │   │   ├── lib/            # Utilities (auth, logger, RBAC)
│   │   │   └── plugins/        # Fastify plugins
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── .env                # Environment variables
│   │   └── package.json
│   │
│   └── web/                    # React + Vite frontend
│       ├── src/
│       │   ├── main.jsx        # Entry point
│       │   ├── App.jsx         # Root component
│       │   ├── pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── hooks/          # Custom hooks
│       │   └── styles/         # Tailwind CSS
│       ├── index.html          # HTML template
│       ├── vite.config.ts      # Vite configuration
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types and utilities
│
├── scripts/                    # Utility scripts (backup, deploy)
├── docs/                       # Comprehensive documentation
│   ├── GETTING-STARTED.md      # User quick start guide
│   ├── FEATURES.md             # Feature documentation
│   ├── FAQ.md                  # Frequently asked questions
│   ├── DEVELOPMENT.md          # Local dev setup
│   ├── ARCHITECTURE.md         # System design
│   ├── CONTRIBUTING.md         # Contributing guide
│   ├── API-REFERENCE.md        # REST API docs
│   └── ERROR-CODES.md          # API error codes
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
├── package.json                # Root package file
└── README.md                   # This file
```

##  Getting Started

### Prerequisites

- **Node.js**: v20 or higher ([Download](https://nodejs.org/))
- **pnpm**: v8 or higher ([Install pnpm](https://pnpm.io/installation))
- **PostgreSQL**: v15+ (local or cloud)
- **Redis**: v7+ (local or Upstash)
- **Git**: Latest version

### Quick Start (5 minutes)

1. **Clone repository**:
```bash
git clone https://github.com/your-org/testtrack-pro.git
cd testtrack-pro
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Configure environment** (see [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for details):
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit with your database and API credentials
```

4. **Setup database**:
```bash
cd apps/api
pnpm prisma migrate dev
```

5. **Start development servers**:
```bash
# From root directory
pnpm dev
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/documentation

### Production Deployment

For production deployment options (Docker, VPS, Cloud platforms), refer to the deployment guides in your hosting provider's documentation.

## ✅ Production Readiness

TestTrack Pro v1 includes comprehensive production features:

### Testing & Quality
- ✅ **70%+ Test Coverage**: 5+ test suites with unit, integration, and component tests
- ✅ **Automated Testing**: GitHub Actions CI runs tests on every push
- ✅ **Code Quality**: ESLint configured, formatted with Prettier

### Monitoring & Observability
- ✅ **Error Tracking**: Sentry.io integration for crash reporting
- ✅ **Health Checks**: 5 health check endpoints for monitoring
- ✅ **Structured Logging**: JSON logs with timestamps and severity levels
- ✅ **Performance Metrics**: API response times and throughput tracking

### Backup & Disaster Recovery
- ✅ **Automated Backups**: Daily PostgreSQL backups to AWS S3
- ✅ **Backup Verification**: Integrity checks on all backups
- ✅ **Restore Procedures**: Documented step-by-step recovery process
- ✅ **RTO/RPO**: ~1 hour recovery time, 24-hour recovery point

### Security
- ✅ **Authentication**: JWT tokens with refresh rotation
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Data Protection**: Encrypted passwords (bcrypt), SSL/TLS required
- ✅ **API Security**: CORS, CSRF protection, rate limiting, input validation
- ✅ **Audit Logging**: Track all critical operations
- ✅ **Vulnerability Scanning**: Automated dependency audits

### Scalability
- ✅ **Stateless APIs**: Horizontal scaling ready
- ✅ **Connection Pooling**: Database connection optimization
- ✅ **Redis Caching**: High-performance data caching
- ✅ **Socket.IO Clustering**: Real-time communication at scale

1. **Terminal 1 - Start Backend:**
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Terminal 2 - Start Frontend:**
   ```bash
   cd apps/web
   pnpm dev
   ```

> ⚠️ **Important**: The frontend requires the backend to be running on port 3001. If you only start the frontend, you'll see proxy errors (`ECONNREFUSED`).

### Individual App Commands

**Frontend (apps/web):**
```bash
pnpm --filter web dev      # Development
pnpm --filter web build    # Production build
pnpm --filter web preview  # Preview build
```

**Backend (apps/api):**
```bash
pnpm --filter api dev      # Development with hot reload
pnpm --filter api start    # Production
```

## 📦 Complete Tech Stack

### Frontend (apps/web)
- **React** 18 - UI library
- **Vite** - Fast build tool and dev server
- **React Router** v6 - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Recharts** - Data visualization
- **Lucide Icons** - Icon library

### Backend (apps/api)
- **Fastify** - High-performance web framework
- **Prisma** - Type-safe ORM with migrations
- **PostgreSQL 15+** - Primary data store
- **Redis** / **Upstash Redis** - Caching & pub-sub
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Sentry** - Error tracking & monitoring
- **Cloudinary** - Image/file storage
- **Resend** - Email service

### Production Ready Features
- **Monitoring**: Sentry.io integration for error tracking
- **Backup & DR**: Automated PostgreSQL backups with AWS S3
- **Health Checks**: Dedicated endpoints for liveness & readiness probes
- **Logging**: JSON structured logging with environment tags
- **API Documentation**: Swagger/OpenAPI integration
- **Security**: Helmet.js, CSRF protection, rate limiting, input validation

### Testing & QA
- **Jest** - Backend unit testing (70%+ coverage)
- **Vitest** - Frontend unit testing (70%+ coverage)
- **React Testing Library** - Component testing
- **Coverage Reports** - LCOV formatted reports

### Build & Deployment
- **Turborepo** - Monorepo task orchestration
- **pnpm** - Package manager with workspaces
- **Docker** - Containerization (Dockerfiles included)
- **GitHub Actions** - CI/CD automated backup workflows

## 🔐 Authentication Flow

1. **Sign Up** (`POST /api/auth/signup`)
   - Accepts email and password
   - Validates input
   - Hashes password with bcryptjs
   - Creates user in database
   - Returns JWT token

2. **Login** (`POST /api/auth/login`)
   - Accepts email and password
   - Verifies credentials against database
   - Returns JWT token on success

3. **Protected Routes**
   - Dashboard requires valid JWT token
   - Token stored in localStorage
   - Automatic redirect to login if unauthorized

## 📝 API Endpoints

### Authentication

**POST /api/auth/signup**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "user": { "id": 1, "email": "user@example.com" },
  "token": "eyJhbGc..."
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com" },
  "token": "eyJhbGc..."
}
```

**GET /health**
```json
Response:
{
  "status": "ok"
}
```



## 🔄 Development Workflow

### Adding a New Package

1. Create package in `packages/` or `apps/`
2. Add `package.json` with `"private": true`
3. Run `pnpm install` to link workspaces
4. Import in other packages using workspace protocol: `"@workspace-name": "workspace:*"`

### Database Migrations

```bash
cd apps/api

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Building for Production

Build all workspaces:
```bash
pnpm build
```

Build specific workspace:
```bash
pnpm --filter web build
```

## 📚 Documentation

Complete documentation for users, developers, and operators:

### User Documentation
| Document | Description |
|----------|-------------|
| [GETTING-STARTED.md](./docs/GETTING-STARTED.md) | Quick start guide for new users (5-minute setup) |
| [FEATURES.md](./docs/FEATURES.md) | Comprehensive feature guide and usage instructions |
| [FAQ.md](./docs/FAQ.md) | Frequently asked questions and troubleshooting |

### Developer Documentation
| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Local dev setup, debugging, common workflows |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, tech decisions, data model, scalability |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Git workflow, code standards, PR process |

### API Documentation
| Document | Description |
|----------|-------------|
| [API-REFERENCE.md](./docs/API-REFERENCE.md) | Complete REST API documentation with examples |
| [ERROR-CODES.md](./docs/ERROR-CODES.md) | API error codes reference with troubleshooting |

## 📚 Scripts Reference

| Command | Description |
|---------|------------|
| `pnpm dev` | Start all apps in dev mode (frontend + backend) |
| `pnpm build` | Build all apps for production |
| `pnpm test` | Run all tests (backend + frontend) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Generate coverage reports |
| `pnpm lint` | Lint all code (ESLint) |
| `pnpm lint:fix` | Lint and fix code automatically |
| `pnpm clean` | Clean artifacts and node_modules |

## � Deployment

### Environment Setup

Before deploying, ensure all required environment variables are configured:

**Backend (.env):**
```env
# Core
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=your-secure-random-secret-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# Cache
REDIS_URL=redis://user:password@host:6379

# Services
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://yourdomain.com
```

### Deployment Options

For production deployment, refer to your hosting provider's documentation:
- **Docker**: Use `Dockerfile` in each app (build from root with `docker build -f apps/api/Dockerfile .`)
- **Cloud Platforms**: 
  - **Vercel/Netlify**: Frontend only, backend on separate service
  - **Railway/Render**: Full-stack deployment with PostgreSQL
  - **AWS/Azure/GCP**: VM with Docker or managed database services
- **VPS**: Ubuntu/Debian with Nginx, PostgreSQL, Redis, and PM2/systemd
- **Docker Compose**: Production-ready composition with all services

## 📖 Learning Resources

### User Guides
- [Getting Started Guide](./docs/GETTING-STARTED.md)
- [Features Guide](./docs/FEATURES.md)
- [FAQ](./docs/FAQ.md)

### Developer Guides
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Development Setup](./docs/DEVELOPMENT.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

### External Resources
- [React Documentation](https://react.dev/)
- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Turborepo Documentation](https://turborepo.org/)
- [pnpm Documentation](https://pnpm.io/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and verify: `pnpm build`
3. Commit with clear messages
4. Push and create a Pull Request

## 📄 License

MIT

## 🆘 Troubleshooting

**pnpm install fails**
- Delete `pnpm-lock.yaml` and try again
- Ensure pnpm is updated: `pnpm add -g pnpm@latest`

**Proxy errors (ECONNREFUSED) when accessing /api routes**
```
[vite] http proxy error: /api/...
AggregateError [ECONNREFUSED]
```
- **Cause**: Backend server is not running
- **Solution**: Start the backend in a separate terminal:
  ```bash
  cd apps/api
  pnpm dev
  ```
- The frontend (Vite) proxies `/api` requests to `http://localhost:3001`
- Both frontend and backend must be running simultaneously

**Port already in use**
- Frontend: Change port in `apps/web/vite.config.js`
- Backend: Change port in `apps/api/src/server.js`

**Database errors**
- Reset: `cd apps/api && npx prisma migrate reset`
- For NeonDB issues, see [NEONDB_SETUP.md](./NEONDB_SETUP.md)

**ESLint errors after updating**
- ESLint 9+ uses flat config format (eslint.config.js)
- Old .eslintrc files are no longer supported
- Run: `pnpm install` to update all dependencies
- See: [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)

## 🔄 Updating Dependencies

This project uses modern package versions. To update:

```bash
# Update all dependencies
pnpm update -r

# Update specific workspace
pnpm --filter api update
pnpm --filter web update

# Check for outdated packages
pnpm outdated -r
```

**Recent Updates:**
- ✅ ESLint 8 → ESLint 9 (flat config)
- ✅ Deprecated packages removed
- ✅ Security vulnerabilities addressed

