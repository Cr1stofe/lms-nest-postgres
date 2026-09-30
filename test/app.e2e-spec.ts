import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('/api/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('/api/docs (GET) - Swagger UI', () => {
    return request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200);
  });

  it('/api/docs-json (GET) - OpenAPI JSON Spec', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(res.body.openapi).toBeDefined();
    expect(res.body.info.title).toBe('Veltro LMS API');
  });

  afterEach(async () => {
    await app.close();
  });
});

