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
├── common/
│   ├── config/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── middleware/
│   ├── prisma/
│   ├── security/
│   ├── mail/
│   └── swagger/
├── modules/
│   ├── auth/
│   ├── lms/
│   └── files/
├── app.controller.ts
├── app.module.ts
├── setup-app.ts
└── main.ts
```

---

## 🚦 Getting Started

### 1. Development (Docker Dev)

```bash
npm run docker:dev
npm run docker:dev:d
npm run docker:down
```

---

### 2. Production Deployment (Docker Compose)

```bash
npm run docker:prod
docker compose logs -f
docker compose down
```

- **Healthcheck:** `https://localhost/api/health` ou `http://localhost/api/health`
- **PostgreSQL Port:** `localhost:5432`

---

### 3. Database Management & Migrations (Prisma)

```bash
npx prisma migrate dev --name <migration_name>
docker compose exec node npx prisma migrate deploy
npm run prisma:seed
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

### 1. Continuous Integration (`.github/workflows/ci.yml`)

- Runs PostgreSQL 18 service container
- Applies Prisma migrations and seed
- Validates code style and TypeScript compilation (`oxlint` & `tsc`)
- Runs 37 unit and E2E integration tests

### 2. Continuous Deployment (`.github/workflows/deploy.yml`)

- Connects to VPS via SSH (`main` branch)
- Pulls repository updates
- Rebuilds and restarts production containers
- Applies pending database migrations

#### 🔑 Required GitHub Secrets:

- `SSH_HOST`: VPS public IP or domain
- `SSH_USER`: SSH user (e.g. `ubuntu`)
- `SSH_PRIVATE_KEY`: Private SSH key
- `WORK_DIR`: Absolute project directory on server
- `SSH_PORT`: SSH port (e.g. `22022`)

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` — Register a new student account
- `POST /api/auth/login` — Authenticate and issue secure session cookie (`__Secure-sid`)
- `DELETE /api/auth/logout` — Invalidate active session and clear cookie
- `GET /api/auth/session` — Retrieve current authenticated user profile
- `PUT /api/auth/password/update` — Change password for authenticated session
- `POST /api/auth/password/forgot` — Request password reset email link
- `POST /api/auth/password/reset` — Reset password using cryptographic token
- `GET /api/auth/users/search` — Paginated user directory search (Admin only, `X-Total-Count`)

### LMS & Courses (`/api/lms`)

- `GET /api/lms/courses` — Public course catalog
- `GET /api/lms/course/:slug` — Course syllabus, lesson list, and student progress
- `POST /api/lms/course` — Create or update course metadata (Admin only)
- `GET /api/lms/lesson/:courseSlug/:slug` — Lesson content with next/prev curriculum navigation
- `POST /api/lms/lesson` — Create or update a lesson (Admin only)
- `GET /api/lms/lessons` — Consolidated list of all lessons (Admin only)
- `POST /api/lms/lesson/complete` — Mark lesson as completed and auto-issue certificate
- `DELETE /api/lms/course/reset` — Reset student course progress and revoke issued certificates
- `GET /api/lms/certificates` — List all certificates earned by authenticated student
- `GET /api/lms/certificate/:id` — Download high-resolution official course certificate PDF

### Files & Media Streaming (`/api/files`)

- `GET /api/files/public/:name` — Stream public asset with ETag validation and HTTP 304 caching
- `GET /api/files/private/:name` — Authenticated private asset access via `X-Accel-Redirect` delegation
- `POST /api/files/upload` — High-speed binary upload stream (`application/octet-stream`, Admin only, up to 150MB)

### System

- `GET /api/health` — Application health check and uptime status
