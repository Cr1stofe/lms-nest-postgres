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
import {
  CourseUpsertResponseDto,
  CourseCatalogItemDto,
  CourseDetailResponseDto,
  LessonUpsertResponseDto,
  AdminLessonItemDto,
  LessonNavigationResponseDto,
  CompleteLessonResponseDto,
  UserCertificateItemDto,
} from './dto/lms-response.dto.js';
import {
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
  ValidationErrorDto,
} from '../../common/dto/problem-details.dto.js';
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
  @ApiResponse({ status: 201, description: 'Course created or updated successfully', type: CourseUpsertResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)', type: ForbiddenErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
  async createCourse(@Body() dto: CourseUpsertDto) {
    return this.lmsService.upsertCourse(dto);
  }

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'Retrieve public course catalog with dynamic lesson counts' })
  @ApiResponse({ status: 200, description: 'List of available courses', type: [CourseCatalogItemDto] })
  @ApiResponse({ status: 404, description: 'No courses found', type: NotFoundErrorDto })
  async listCourses() {
    return this.lmsService.listCourses();
  }

  @Public()
  @Get('course/:slug')
  @ApiOperation({ summary: 'Get course details, curriculum, and authenticated student progress' })
  @ApiParam({ name: 'slug', description: 'Course unique slug identifier', example: 'html-css-for-beginners' })
  @ApiResponse({ status: 200, description: 'Course details, lessons list, and completion status', type: CourseDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Course not found', type: NotFoundErrorDto })
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
  @ApiResponse({ status: 201, description: 'Lesson saved successfully', type: LessonUpsertResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)', type: ForbiddenErrorDto })
  @ApiResponse({ status: 404, description: 'Parent course not found', type: NotFoundErrorDto })
  @ApiResponse({ status: 422, description: 'Validation failed on input payload', type: ValidationErrorDto })
  async createLesson(@Body() dto: LessonUpsertDto) {
    return this.lmsService.upsertLesson(dto);
  }

  @Roles('admin')
  @Get('lessons')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'List all registered lessons across courses (Admin only)' })
  @ApiResponse({ status: 200, description: 'Consolidated list of all lessons', type: [AdminLessonItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)', type: ForbiddenErrorDto })
  @ApiResponse({ status: 404, description: 'No lessons found', type: NotFoundErrorDto })
  async listLessons() {
    return this.lmsService.listAllLessons();
  }

  @Public()
  @Get('lesson/:courseSlug/:lessonSlug')
  @ApiOperation({ summary: 'Get lesson content and video streaming data with prev/next navigation' })
  @ApiParam({ name: 'courseSlug', description: 'Course slug identifier', example: 'html-css-for-beginners' })
  @ApiParam({ name: 'lessonSlug', description: 'Lesson slug identifier', example: 'basic-tags' })
  @ApiResponse({ status: 200, description: 'Lesson content and navigation metadata', type: LessonNavigationResponseDto })
  @ApiResponse({ status: 404, description: 'Lesson or course not found', type: NotFoundErrorDto })
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
  @ApiResponse({ status: 201, description: 'Lesson marked as completed. Returns certificate ID if course reached 100%', type: CompleteLessonResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiResponse({ status: 404, description: 'Lesson or course not found', type: NotFoundErrorDto })
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
  @ApiResponse({ status: 200, description: 'Course progress and certificates reset successfully', schema: { type: 'object', properties: { title: { type: 'string', example: 'curso resetado' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
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
  @ApiResponse({ status: 200, description: 'List of student certificates', type: [UserCertificateItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  async listCertificates(@CurrentUser('user_id') userId: number) {
    return this.lmsService.listUserCertificates(userId);
  }

  @Public()
  @Get('certificate/:id')
  @ApiOperation({ summary: 'Download high-resolution official course certificate PDF' })
  @ApiParam({ name: 'id', description: 'Certificate UUID', example: '35c20e46-3fc0-466c-85fc-947073c06c0a' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'High-resolution PDF buffer' })
  @ApiResponse({ status: 404, description: 'Certificate not found', type: NotFoundErrorDto })
  async getCertificatePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.lmsService.getCertificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer);
  }
}

