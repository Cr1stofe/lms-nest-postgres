import {
  Module,
  type NestModule,
  type MiddlewareConsumer,
} from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { SecurityModule } from './common/security/security.module.js';
import { MailModule } from './common/mail/mail.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { LmsModule } from './modules/lms/lms.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    MailModule,
    AuthModule,
    LmsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
