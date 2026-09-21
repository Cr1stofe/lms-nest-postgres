import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { PasswordService } from '../src/common/security/password.service.js';

describe('Suíte de Testes: Arquivos e Healthcheck (/files e /health)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  let adminCookie: string;
  let userCookie: string;

  const testUser = {
    name: 'Henrique Barros',
    username: 'henriquebarros',
    email: 'henrique.barros@exemplo.com',
    password: 'P@ssw0rd123',
  };

  const adminUser = {
    email: 'admin@lms.com',
    password: 'P@ssw0rd123',
  };

  let uploadedPublicFileName: string;
  let uploadedPublicETag: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    passwordService = app.get(PasswordService);

    // Garante que o usuário de teste exista
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    const hashedPassword = await passwordService.hash(testUser.password);
    await prisma.user.create({
      data: {
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });

    // Login do Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminUser);

    if (adminLoginRes.status === 200) {
      const rawCookie = adminLoginRes.headers['set-cookie'];
      adminCookie = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie!;
    }

    // Login do Usuário comum
    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    if (userLoginRes.status === 200) {
      const rawCookie = userLoginRes.headers['set-cookie'];
      userCookie = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie!;
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  it('1. Deve responder o healthcheck da API com status 200', async () => {
    const res = await request(app.getHttpServer()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('2. Deve retornar 404 para rota inexistente', async () => {
    const res = await request(app.getHttpServer()).get('/rota-que-nao-existe');

    expect(res.status).toBe(404);
  });

  it('3. Deve proteger arquivo privado contra acesso anônimo (401)', async () => {
    const res = await request(app.getHttpServer()).get(
      '/files/private/documento-secreto.pdf',
    );

    expect(res.status).toBe(401);
    expect(res.body.title).toBe('não autorizado');
  });

  it('4. Deve permitir acesso ao arquivo privado para usuário autenticado (200 com X-Accel-Redirect)', async () => {
    const res = await request(app.getHttpServer())
      .get('/files/private/documento-secreto.pdf')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.headers['x-accel-redirect']).toBe('documento-secreto.pdf');
  });

  it('5. Deve rejeitar upload sem cabeçalho application/octet-stream (415)', async () => {
    const res = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Cookie', adminCookie)
      .send({ data: 'invalido' });

    expect(res.status).toBe(415);
    expect(res.body.title).toBe('use octet-stream');
  });

  it('6. Deve rejeitar upload feito por usuário sem permissão de Admin (403)', async () => {
    const payload = Buffer.from('conteudo teste');
    const res = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Cookie', userCookie)
      .set('Content-Type', 'application/octet-stream')
      .set('Content-Length', payload.length.toString())
      .set('X-Filename', 'teste.png')
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.title).toBe('sem permissão');
  });

  it('7. Deve rejeitar arquivo público inexistente com 404', async () => {
    const res = await request(app.getHttpServer()).get(
      '/files/public/nao-existe.png',
    );

    expect(res.status).toBe(404);
    expect(res.body.title).toBe('arquivo não encontrado');
  });

  it('8. Deve permitir que o Admin faça upload de arquivo público via octet-stream (201)', async () => {
    const payload = Buffer.from('teste de upload stream publico');
    const res = await request(app.getHttpServer())
      .post('/files/upload')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'application/octet-stream')
      .set('Content-Length', payload.length.toString())
      .set('X-Filename', 'teste-doc.txt')
      .set('X-Visibility', 'public')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.name).toBeDefined();
    expect(res.body.path).toBeDefined();

    uploadedPublicFileName = res.body.name;
  });

  it('9. Deve servir o arquivo público enviado com status 200 e cabeçalhos de cache', async () => {
    const res = await request(app.getHttpServer()).get(
      `/files/public/${uploadedPublicFileName}`,
    );

    expect(res.status).toBe(200);
    expect(res.headers['etag']).toBeDefined();
    expect(res.headers['cache-control']).toBe(
      'public, max-age=0, must-revalidate',
    );
    expect(res.text).toBe('teste de upload stream publico');

    uploadedPublicETag = res.headers['etag'];
  });

  it('10. Deve responder com status 304 Not Modified se If-None-Match coincidir com ETag', async () => {
    const res = await request(app.getHttpServer())
      .get(`/files/public/${uploadedPublicFileName}`)
      .set('If-None-Match', uploadedPublicETag);

    expect(res.status).toBe(304);
  });
});
