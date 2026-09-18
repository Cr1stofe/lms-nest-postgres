import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionService } from './services/session.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard],
  exports: [AuthService, SessionService, AuthGuard, RolesGuard],
})
export class AuthModule {}
