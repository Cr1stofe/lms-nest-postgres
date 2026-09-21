import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LmsService } from './lms.service.js';
import { CourseUpsertDto } from './dto/course-upsert.dto.js';
import { LessonUpsertDto } from './dto/lesson-upsert.dto.js';
import { CompleteLessonDto } from './dto/complete-lesson.dto.js';
import { ResetCourseDto } from './dto/reset-course.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Controller('lms')
@UseGuards(AuthGuard, RolesGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Roles('admin')
  @Post('course')
  async createCourse(@Body() dto: CourseUpsertDto) {
    return this.lmsService.upsertCourse(dto);
  }

  @Public()
  @Get('courses')
  async listCourses() {
    return this.lmsService.listCourses();
  }

  @Public()
  @Get('course/:slug')
  async getCourse(
    @Param('slug') slug: string,
    @CurrentUser('user_id') userId?: number,
  ) {
    return this.lmsService.getCourseBySlug(slug, userId);
  }

  @Roles('admin')
  @Post('lesson')
  async createLesson(@Body() dto: LessonUpsertDto) {
    return this.lmsService.upsertLesson(dto);
  }

  @Roles('admin')
  @Get('lessons')
  async listLessons() {
    return this.lmsService.listAllLessons();
  }

  @Public()
  @Get('lesson/:courseSlug/:lessonSlug')
  async getLesson(
    @Param('courseSlug') courseSlug: string,
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser('user_id') userId?: number,
  ) {
    return this.lmsService.getLessonWithNavigation(
      courseSlug,
      lessonSlug,
      userId,
    );
  }

  @Roles('user')
  @Post('lesson/complete')
  async completeLesson(
    @Body() dto: CompleteLessonDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.completeLesson(dto.courseId, dto.lessonId, userId);
  }

  @Roles('user')
  @Delete('course/reset')
  async resetCourse(
    @Body() dto: ResetCourseDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.resetCourseProgress(dto.courseId, userId);
  }

  @Roles('user')
  @Get('certificates')
  async listCertificates(@CurrentUser('user_id') userId: number) {
    return this.lmsService.listUserCertificates(userId);
  }

  @Public()
  @Get('certificate/:id')
  async getCertificatePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.lmsService.getCertificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer);
  }
}
