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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
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

@ApiTags('LMS')
@Controller('lms')
@UseGuards(AuthGuard, RolesGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Roles('admin')
  @Post('course')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Create or update a course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created or updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  async createCourse(@Body() dto: CourseUpsertDto) {
    return this.lmsService.upsertCourse(dto);
  }

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'Retrieve public course catalog with dynamic lesson counts' })
  @ApiResponse({ status: 200, description: 'List of available courses' })
  async listCourses() {
    return this.lmsService.listCourses();
  }

  @Public()
  @Get('course/:slug')
  @ApiOperation({ summary: 'Get course details, curriculum, and authenticated student progress' })
  @ApiParam({ name: 'slug', description: 'Course unique slug identifier', example: 'html-css-for-beginners' })
  @ApiResponse({ status: 200, description: 'Course details, lessons list, and completion status' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourse(
    @Param('slug') slug: string,
    @CurrentUser('user_id') userId?: number,
  ) {
    return this.lmsService.getCourseBySlug(slug, userId);
  }

  @Roles('admin')
  @Post('lesson')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Create or update a course lesson (Admin only)' })
  @ApiResponse({ status: 201, description: 'Lesson saved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  async createLesson(@Body() dto: LessonUpsertDto) {
    return this.lmsService.upsertLesson(dto);
  }

  @Roles('admin')
  @Get('lessons')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'List all registered lessons across courses (Admin only)' })
  @ApiResponse({ status: 200, description: 'Consolidated list of all lessons' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  async listLessons() {
    return this.lmsService.listAllLessons();
  }

  @Public()
  @Get('lesson/:courseSlug/:lessonSlug')
  @ApiOperation({ summary: 'Get lesson content and video streaming data with prev/next navigation' })
  @ApiParam({ name: 'courseSlug', description: 'Course slug identifier', example: 'html-css-for-beginners' })
  @ApiParam({ name: 'lessonSlug', description: 'Lesson slug identifier', example: 'basic-tags' })
  @ApiResponse({ status: 200, description: 'Lesson content and navigation metadata' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
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
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Mark a lesson as completed and issue certificate upon 100% completion' })
  @ApiResponse({ status: 201, description: 'Lesson marked as completed. Returns certificate ID if course reached 100%' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeLesson(
    @Body() dto: CompleteLessonDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.completeLesson(dto.courseId, dto.lessonId, userId);
  }

  @Roles('user')
  @Delete('course/reset')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Reset all student progress and issued certificates for a course' })
  @ApiResponse({ status: 200, description: 'Course progress and certificates reset successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetCourse(
    @Body() dto: ResetCourseDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.resetCourseProgress(dto.courseId, userId);
  }

  @Roles('user')
  @Get('certificates')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'List all certificates issued to the authenticated student' })
  @ApiResponse({ status: 200, description: 'List of student certificates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listCertificates(@CurrentUser('user_id') userId: number) {
    return this.lmsService.listUserCertificates(userId);
  }

  @Public()
  @Get('certificate/:id')
  @ApiOperation({ summary: 'Download high-resolution official course certificate PDF' })
  @ApiParam({ name: 'id', description: 'Certificate UUID', example: '35c20e46-3fc0-466c-85fc-947073c06c0a' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'High-resolution PDF buffer' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async getCertificatePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.lmsService.getCertificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer);
  }
}

