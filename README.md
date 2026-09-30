# LMS Backend (NestJS + PostgreSQL 18 + Prisma 7)

Enterprise-grade Learning Management System (LMS) backend API built with **NestJS**, **PostgreSQL 18**, **Prisma ORM 7**, **TypeScript**, and **Caddy 2**.

---

## 🛠️ Architecture & Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (Modular architecture, Dependency Injection, Custom Guards & Decorators)
- **Database:** [PostgreSQL 18](https://www.postgresql.org/) via Docker
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

The API provides interactive OpenAPI 3.0 documentation:

- **Local Development:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Production (Caddy TLS):** `https://your-domain.com/api/docs`
- **OpenAPI JSON Spec:** [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

### 🔑 Seed Test Credentials

| Role      | Email                         | Default Password |
| :-------- | :---------------------------- | :--------------- |
| **Admin** | `admin@lms.com`               | `P@ssw0rd123`    |
| **Editor**| `editor@lms.com`              | `P@ssw0rd123`    |
| **Student**| `student@example.com`        | `P@ssw0rd123`    |

---

## 📂 Project Structure

```
src/
├── common/                  # Shared infrastructure and cross-cutting concerns
│   ├── config/              # Centralized environment variables and secrets (env.ts)
│   ├── decorators/          # Custom decorators (@CurrentUser, @Roles, @Public)
│   ├── filters/             # RFC 7807 problem+json standard exception filter
│   ├── guards/              # Authentication and RBAC authorization guards
│   ├── middleware/          # Request logging and latency tracking middleware
│   ├── prisma/              # Prisma database client service and module (@Global)
│   ├── security/            # Password hashing, cryptographic tokens, and secrets
│   ├── mail/                # Transactional email service and templates
│   └── swagger/             # Swagger OpenAPI configuration and custom theme
├── modules/
│   ├── auth/                # Authentication, sessions, password recovery, and users
│   ├── lms/                 # Courses, lessons, student progress, and PDF certificates
│   └── files/               # Binary uploads, media streaming, and X-Accel-Redirect
├── app.controller.ts        # Healthcheck endpoint (GET /api/health)
├── app.module.ts            # Root application module
├── setup-app.ts             # Application configuration bootstrap (pipes, filters, cookies)
└── main.ts                  # Server entrypoint bootstrap
```

---

## 🚦 Getting Started

### 1. Development with Hot-Reload (Docker Dev)

Uses `compose.dev.yaml` with host volume bind mounts and NestJS watch mode:

```bash
npm run docker:dev
```

To run in detached background mode:

```bash
npm run docker:dev:d
```

To stop development containers:

```bash
npm run docker:down
```

---

### 2. Production Deployment (Docker Compose)

Optimized multi-stage build without `devDependencies`, served behind Caddy reverse proxy:

```bash
npm run docker:prod
docker compose logs -f
docker compose down
```

- **API Healthcheck:** `https://localhost/api/health` or `http://localhost/api/health`
- **PostgreSQL Port:** `localhost:5432`

---

### 3. Database Management & Migrations (Prisma)

Generate and apply new migrations during local development:

```bash
npx prisma migrate dev --name <migration_name>
```

Apply pending migrations in production or inside containers:

```bash
docker compose exec node npx prisma migrate deploy
```

Seed database with default roles, admin account, and starter courses:

```bash
npm run prisma:seed
```

Open interactive database GUI:

```bash
npx prisma studio
```

---

## 🧪 Testing & Quality Assurance

```bash
npm test
npm run test:e2e
npm run lint
npm run build
```

---

## 🔄 CI/CD Pipelines (GitHub Actions)

Configured automated workflows in `.github/workflows/`:

### 1. **Continuous Integration (`.github/workflows/ci.yml`)**

Triggers on every `push` and `pull_request`:

- Initializes a dedicated **PostgreSQL 18** service container.
- Applies Prisma database migrations (`prisma migrate deploy`) and seeds test fixtures.
- Runs linter checks (`oxlint`) and TypeScript compilation (`tsc`).
- Executes unit tests and **37 E2E integration test suites**.

### 2. **Continuous Deployment (`.github/workflows/deploy.yml`)**

Triggers automatically on `push` to the `main` branch:

- Connects to the **VPS via SSH**.
- Pulls the latest commits (`git pull origin main`).
- Rebuilds and restarts production containers (`docker compose up --build -d`).
- Runs pending database migrations (`prisma migrate deploy`).

#### 🔑 Required GitHub Secrets (`Settings > Secrets and variables > Actions`):

- `SSH_HOST`: Server public IP address or hostname.
- `SSH_USER`: SSH login user (e.g., `ubuntu`).
- `SSH_PRIVATE_KEY`: Private SSH authentication key.
- `WORK_DIR`: Absolute project path on the remote host (e.g., `/home/ubuntu/lms-nest-postgres`).
- `SSH_PORT`: SSH connection port (e.g., `22`).

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)

- `POST /api/auth/register` — Register a new student account
- `POST /api/auth/login` — Authenticate user and issue session cookie (`__Secure-sid`)
- `DELETE /api/auth/logout` — Invalidate active session and clear cookie
- `GET /api/auth/session` — Retrieve authenticated user profile
- `PUT /api/auth/password/update` — Update password for authenticated session
- `POST /api/auth/password/forgot` — Request password reset email link
- `POST /api/auth/password/reset` — Reset password using cryptographic token
- `GET /api/auth/users/search` — Paginated user directory search (Admin only, includes `X-Total-Count` header)

### LMS & Courses (`/api/lms`)

- `GET /api/lms/courses` — Public course catalog with dynamic lesson counts
- `GET /api/lms/course/:slug` — Course syllabus, lessons list, and student progress
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
