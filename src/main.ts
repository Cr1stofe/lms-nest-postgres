import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';
import { PORT } from './common/config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  await app.listen(PORT);
  console.log(`🚀 LMS NestJS Backend rodando na porta ${PORT}`);
}
await bootstrap();
