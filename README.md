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
- **Testes & Qualidade:** [Vitest](https://vitest.dev/) (Unitários e E2E) e [Oxlint](https://oxc.rs/)

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

### 1. Ambiente Completo com Docker (Recomendado)

Sobe todos os containers integrados (PostgreSQL 18, Backend NestJS em Multi-Stage Build e Caddy):

```bash
# Iniciar todos os serviços
docker compose up --build -d

# Visualizar logs em tempo real
docker compose logs -f

# Parar serviços
docker compose down
```

- **Healthcheck da API:** `http://localhost/api/health` ou `http://localhost:3000/health`
- **Banco PostgreSQL:** `localhost:5432`

---

### 2. Ambiente de Desenvolvimento Local (Hot-Reload)

```bash
# 1. Subir apenas o banco de dados
docker compose up -d postgres

# 2. Sincronizar o schema e popular dados iniciais (Seed)
npx prisma db push
npm run prisma:seed

# 3. Iniciar o servidor de desenvolvimento
npm run start:dev
```

---

### 3. Visualizar Banco com Prisma Studio

```bash
npx prisma studio
```

Acesse em: `http://localhost:5555`

---

## 🧪 Testes & Validação

```bash
# Testes Unitários
npm test

# Testes de Integração Ponta a Ponta (E2E)
npm run test:e2e

# Validar Build de Produção
npm run build

# Linter
npm run lint
```

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
- `GET /api/lms/courses` — Catálogo público de cursos
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
