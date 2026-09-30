# 🚀 LMS Backend (NestJS + PostgreSQL 18 + Prisma 7)

Backend corporativo para plataforma LMS (Learning Management System), desenvolvido com **NestJS**, **PostgreSQL 18**, **Prisma ORM 7**, **TypeScript** e **Vitest**.

---

## 🛠️ Tecnologias & Arquitetura

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript, Arquitetura Modular, Injeção de Dependências)
- **Banco de Dados:** [PostgreSQL 18](https://www.postgresql.org/) via Docker
- **ORM & Driver:** [Prisma 7](https://www.prisma.io/) com `@prisma/adapter-pg` e `pg.Pool`
- **Validação & DTOs:** `class-validator` e `class-transformer`
- **Autenticação & Sessões:** Cookies `__Secure-sid` (HttpOnly, SameSite: Lax), RBAC (`user`, `admin`), Criptografia `scrypt` com salt, pepper e normalização NFC
- **Certificados:** Emissão de PDF com [jsPDF](https://github.com/parallax/jsPDF)
- **Armazenamento & Streaming:** Uploads binários via `application/octet-stream`, entrega com cache `ETag` (304 Not Modified) e `X-Accel-Redirect`
- **Proxy Reverso:** [Caddy 2](https://caddyserver.com/) com terminação TLS automática
- **Documentação Interativa:** [Swagger / OpenAPI](https://swagger.io/) em `/api/docs`
- **Testes & Qualidade:** [Vitest](https://vitest.dev/) (38 testes E2E e unitários) e [Oxlint](https://oxc.rs/)
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) (Testes automatizados com PostgreSQL Service Container + Deploy contínuo via SSH nativo na VPS)

---

## 📖 Documentação Interativa da API (Swagger UI)

A aplicação conta com documentação interativa completa (OpenAPI 3.0):

- **URL Local (Desenvolvimento):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **URL Produção (Caddy TLS):** `https://seu-dominio.com/api/docs`
- **Especificação OpenAPI JSON pura:** [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

### 🔑 Credenciais Padrão do Seed para Testes:

| Papel (Role) | E-mail                        | Senha Padrão  |
| :----------- | :---------------------------- | :------------ |
| **Admin**    | `admin@lms.com`               | `P@ssw0rd123` |
| **Editor**   | `editor@lms.com`              | `P@ssw0rd123` |
| **Aluno**    | `henrique.barros@exemplo.com` | `P@ssw0rd123` |

---

## 📂 Estrutura do Projeto

```
src/
├── common/                  # Infraestrutura transversal e compartilhada
│   ├── config/              # Leitura centralizada de variáveis e secrets (env.ts)
│   ├── decorators/          # @CurrentUser(), @Roles(), @Public()
│   ├── filters/             # HttpExceptionFilter (Padronização RFC 7807 problem+json)
│   ├── guards/              # AuthGuard, RolesGuard (RBAC)
│   ├── middleware/          # LoggerMiddleware (logs de requisição e latência)
│   ├── prisma/              # PrismaService e PrismaModule (@Global)
│   ├── security/            # PasswordService, SecurityModule, tokens.ts (@Global)
│   └── mail/                # MailService e MailModule (@Global)
├── modules/
│   ├── auth/                # Módulo de Autenticação, Usuários e Recuperação de Senha
│   ├── lms/                 # Módulo de Cursos, Aulas, Progresso e Certificados
│   └── files/               # Módulo de Uploads e Streaming de Arquivos
├── app.controller.ts        # Healthcheck (GET /health) e rota raiz
├── app.module.ts            # Módulo principal da aplicação
├── setup-app.ts             # Configuração compartilhada de pipes, filters e cookies
└── main.ts                  # Bootstrap da aplicação
```

---

## 🚦 Como Rodar a Aplicação

### 1. Ambiente de Desenvolvimento com Hot-Reload (Docker Dev)

Utiliza o [compose.dev.yaml](file:///Volumes/D/Projetos/backend/nodejs/lms-nest-postgres/compose.dev.yaml) com _bind mount_ de código e NestJS _watch mode_:

```bash
npm run docker:dev
npm run docker:dev:d
npm run docker:down
```

---

### 2. Ambiente de Produção com Docker

Build otimizado sem `devDependencies` com Caddy Server e PostgreSQL:

```bash
npm run docker:prod
docker compose logs -f
docker compose down
```

- **Healthcheck da API:** `https://localhost/api/health` ou `http://localhost/api/health`
- **Banco PostgreSQL:** `localhost:5432`

---

### 3. Migrations & Banco de Dados (Prisma)

```bash
npx prisma migrate dev --name nome_da_alteracao
docker compose exec node npx prisma migrate deploy
npm run prisma:seed
npx prisma studio
```

---

## 🧪 Testes & Qualidade

```bash
npm test
npm run test:e2e
npm run build
npm run lint
```

---

## 🔄 Pipeline de CI/CD (GitHub Actions)

A aplicação conta com esteira automatizada em `.github/workflows/`:

### 1. **CI Pipeline (`.github/workflows/ci.yml`):**

Disparado a cada `push` e `pull_request`:

- Sobe um container de serviço **PostgreSQL 18** no runner do GitHub.
- Aplica migrations do Prisma (`prisma migrate deploy`) e executa o seed de testes.
- Valida o linter (`oxlint`) e a compilação do TypeScript (`tsc`).
- Executa a suíte de testes unitários e os **35 testes E2E** de integração.

### 2. **CD Pipeline (`.github/workflows/deploy.yml`):**

Disparado automaticamente ao realizar merge/push na branch `main`:

- Conecta na sua **VPS via SSH**.
- Atualiza o repositório (`git pull origin main`).
- Reconstrói os containers (`docker compose up --build -d`).
- Aplica as migrations pendentes no banco de produção (`prisma migrate deploy`).

#### 🔑 Segredos necessários no GitHub (`Settings > Secrets and variables > Actions`):

- `SSH_HOST`: IP público ou domínio da sua VPS.
- `SSH_USER`: Usuário SSH (ex: `ubuntu` ou `root`).
- `SSH_PRIVATE_KEY`: Chave privada SSH para autenticação (sem senha ou com `SSH_PASSPHRASE`).
- `WORK_DIR`: Diretório do projeto no servidor (ex: `/home/ubuntu/lms-nest-postgres` ou `/var/www/lms-nest-postgres`).
- `SSH_PORT`: Porta SSH (padrão: `22`).

---

## 📡 Principais Endpoints da API

### Autenticação (`/api/auth`)

- `POST /api/auth/register` — Cadastro de novos alunos
- `POST /api/auth/login` — Login com emissão de cookie de sessão `__Secure-sid`
- `DELETE /api/auth/logout` — Encerramento e invalidação de sessão
- `GET /api/auth/session` — Dados da sessão do usuário autenticado
- `PUT /api/auth/password/update` — Alteração de senha logado
- `POST /api/auth/password/forgot` — Solicitação de link de recuperação
- `POST /api/auth/password/reset` — Redefinição de senha com token
- `GET /api/auth/users/search` — Listagem paginada de usuários (Admin, header `X-Total-Count`)

### LMS & Cursos (`/api/lms`)

- `GET /api/lms/courses` — Catálogo público de cursos (com contagem dinâmica de aulas)
- `GET /api/lms/course/:slug` — Detalhes do curso com lista de aulas e progresso do aluno
- `POST /api/lms/course` — Criar ou atualizar curso (Admin)
- `GET /api/lms/lesson/:courseSlug/:slug` — Detalhes da aula e navegação (`prev`/`next`)
- `POST /api/lms/lesson` — Criar ou atualizar aula (Admin)
- `GET /api/lms/lessons` — Listagem de todas as aulas cadastradas (Admin)
- `POST /api/lms/lesson/complete` — Conclusão de aula e emissão automática de certificado
- `DELETE /api/lms/course/reset` — Reset de progresso do aluno no curso
- `GET /api/lms/certificates` — Certificados emitidos para o aluno
- `GET /api/lms/certificate/:id` — Download do PDF do certificado

### Arquivos & Streaming (`/api/files` e `/files`)

- `GET /api/files/public/:name` ou `GET /files/public/:name` — Download com cache HTTP e ETag (`304 Not Modified`)
- `GET /api/files/private/:name` ou `GET /files/private/:name` — Acesso seguro a arquivo privado via header `X-Accel-Redirect`
- `POST /api/files/upload` — Upload por streaming binário `application/octet-stream` (Admin, até 150MB)

### Sistema

- `GET /api/health` — Verificação de saúde da aplicação
