import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller.js';
import { LmsService } from './lms.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
