# LMS Backend (NestJS + PostgreSQL 18 + Prisma 7)

Enterprise-grade Learning Management System (LMS) backend API built with **NestJS**, **PostgreSQL 18**, **Prisma ORM 7**, **TypeScript**, and **Caddy 2**.

---

## 🛠️ Architecture & Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (Modular architecture, Dependency Injection, Custom Guards & Decorators)
- **Database:** [PostgreSQL 18](https://www.postgresql.org/) running on Docker
- **ORM & Driver:** [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` connection pool
- **Validation & DTOs:** `class-validator` and `class-transformer`
- **Authentication & Security:**
  - Secure `__Secure-sid` cookies (`HttpOnly`, `SameSite: Lax`, `Secure`)
  - Role-Based Access Control (`user`, `admin`)
  - Password hashing with `scrypt`, unique salts, system pepper secrets, and Unicode NFC normalization
- **Certificates:** Automated vector PDF certificate generation via [jsPDF](https://github.com/parallax/jsPDF)
- **File Storage & Streaming:** Binary streaming uploads (`application/octet-stream`), `ETag` conditional caching (`304 Not Modified`), and accelerated private downloads via `X-Accel-Redirect`
- **Reverse Proxy:** [Caddy 2](https://caddyserver.com/) with automatic TLS termination and reverse proxying
- **API Documentation:** [Swagger / OpenAPI 3.0](https://swagger.io/) at `/api/docs`
- **Testing & Quality:** [Vitest](https://vitest.dev/) (Unit & E2E integration suites) and [Oxlint](https://oxc.rs/)
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) with automated test runners and native SSH VPS deployment

---

## 📖 Interactive API Documentation (Swagger UI)

The API is fully documented using OpenAPI 3.0:

- **Local Development:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Production (Caddy TLS):** `https://your-domain.com/api/docs`
- **OpenAPI JSON Spec:** [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

### 🔑 Test Seed Credentials

| Role      | Email                         | Default Password |
| :-------- | :---------------------------- | :--------------- |
| **Admin** | `admin@lms.com`               | `P@ssw0rd123`    |
| **Editor**| `editor@lms.com`              | `P@ssw0rd123`    |
| **Student**| `student@example.com`        | `P@ssw0rd123`    |

---

## 📂 Project Structure

```
src/
├── common/                  # Cross-cutting infrastructure and shared utilities
│   ├── config/              # Centralized environment variables and secrets (env.ts)
│   ├── decorators/          # @CurrentUser(), @Roles(), @Public()
│   ├── filters/             # HttpExceptionFilter (RFC 7807 problem+json standard)
│   ├── guards/              # AuthGuard, RolesGuard (RBAC)
│   ├── middleware/          # LoggerMiddleware (request logging & latency tracking)
│   ├── prisma/              # PrismaService and PrismaModule (@Global)
│   ├── security/            # PasswordService, SecurityModule, tokens.ts (@Global)
│   ├── mail/                # MailService and MailModule (@Global)
│   └── swagger/             # Swagger/OpenAPI setup and dark UI theme
├── modules/
│   ├── auth/                # Authentication, sessions, password recovery, user directory
│   ├── lms/                 # Courses, lessons, student progress, PDF certificates
│   └── files/               # Binary uploads, media streaming, X-Accel-Redirect
├── app.controller.ts        # Healthcheck endpoint (GET /api/health)
├── app.module.ts            # Root application module
├── setup-app.ts             # Shared application bootstrap (pipes, filters, cookie parser)
└── main.ts                  # Entrypoint bootstrap
```

---

## 🚦 Getting Started

### 1. Development with Hot-Reload (Docker Dev)

Runs `compose.dev.yaml` with host volume bind mounts and NestJS watch mode:

```bash
# Start containers in foreground
npm run docker:dev

# Or start in detached background mode
npm run docker:dev:d

# Stop development containers
npm run docker:down
```

---

### 2. Production Deployment (Docker Compose)

Multi-stage build without `devDependencies`, served behind Caddy reverse proxy:

```bash
# Build and run production stack
npm run docker:prod

# Inspect logs
docker compose logs -f

# Teardown stack
docker compose down
```

- **Healthcheck:** `https://localhost/api/health` or `http://localhost/api/health`
- **PostgreSQL Port:** `localhost:5432`

---

### 3. Database Management & Migrations (Prisma)

```bash
# Create and apply a new migration during development
npx prisma migrate dev --name <migration_name>

# Apply pending migrations in production / container
docker compose exec node npx prisma migrate deploy

# Seed database with initial roles, admin, and demo courses
npm run prisma:seed

# Launch visual database browser
npx prisma studio
```

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit tests
npm test

# Run End-to-End (E2E) integration test suite
npm run test:e2e

# Run linter
npm run lint

# Compile TypeScript production build
npm run build
```

---

## 🔄 CI/CD Pipelines (GitHub Actions)

Automated workflows are configured in `.github/workflows/`:

### 1. **Continuous Integration (`.github/workflows/ci.yml`)**

Triggers on every `push` and `pull_request`:

- Spins up a **PostgreSQL 18** service container on the GitHub runner.
- Executes Prisma migrations (`prisma migrate deploy`) and test seeds.
- Runs linter checks (`oxlint`) and TypeScript compilation (`tsc`).
- Executes all unit and **37 E2E integration tests**.

### 2. **Continuous Deployment (`.github/workflows/deploy.yml`)**

Triggers on `push` to the `main` branch:

- Connects to the **VPS via SSH**.
- Pulls latest changes (`git pull origin main`).
- Rebuilds and restarts containers (`docker compose up --build -d`).
- Applies pending database migrations (`prisma migrate deploy`).

#### 🔑 Required GitHub Secrets (`Settings > Secrets and variables > Actions`):

- `SSH_HOST`: Server public IP or domain.
- `SSH_USER`: SSH login user (e.g., `ubuntu` or `root`).
- `SSH_PRIVATE_KEY`: Private SSH authentication key.
- `WORK_DIR`: Absolute project path on the remote server (e.g., `/home/ubuntu/lms-nest-postgres`).
- `SSH_PORT`: SSH connection port (e.g., `22022`).

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)

- `POST /api/auth/register` — Register a new student account
- `POST /api/auth/login` — Authenticate and issue secure session cookie (`__Secure-sid`)
- `DELETE /api/auth/logout` — Invalidate active session and clear cookie
- `GET /api/auth/session` — Retrieve current authenticated user profile
- `PUT /api/auth/password/update` — Change password for authenticated session
- `POST /api/auth/password/forgot` — Request password reset email link
- `POST /api/auth/password/reset` — Reset password using cryptographic token
- `GET /api/auth/users/search` — Paginated user directory search (Admin only, includes `X-Total-Count` header)

### LMS & Courses (`/api/lms`)

- `GET /api/lms/courses` — Public course catalog with dynamic lesson counts
- `GET /api/lms/course/:slug` — Course syllabus, lesson list, and authenticated student progress
- `POST /api/lms/course` — Create or update course metadata (Admin only)
- `GET /api/lms/lesson/:courseSlug/:slug` — Lesson content with next/prev curriculum navigation
- `POST /api/lms/lesson` — Create or update a lesson (Admin only)
- `GET /api/lms/lessons` — Consolidated list of all lessons across courses (Admin only)
- `POST /api/lms/lesson/complete` — Mark lesson as completed and auto-issue certificate upon 100% completion
- `DELETE /api/lms/course/reset` — Reset student course progress and revoke issued certificates
- `GET /api/lms/certificates` — List all certificates earned by authenticated student
- `GET /api/lms/certificate/:id` — Download high-resolution official course certificate PDF

### Files & Media Streaming (`/api/files`)

- `GET /api/files/public/:name` — Stream public asset with ETag validation and HTTP 304 caching
- `GET /api/files/private/:name` — Authenticated private asset access via `X-Accel-Redirect` delegation
- `POST /api/files/upload` — High-speed binary upload stream (`application/octet-stream`, Admin only, up to 150MB)

### System & Diagnostics

- `GET /api/health` — Application health check and uptime status
