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
  @ApiOperation({ summary: 'Criar ou atualizar curso (Exclusivo Admin)' })
  @ApiResponse({ status: 201, description: 'Curso criado ou atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer papel de admin)' })
  async createCourse(@Body() dto: CourseUpsertDto) {
    return this.lmsService.upsertCourse(dto);
  }

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'Listar catálogo de cursos com total de aulas dinâmico' })
  @ApiResponse({ status: 200, description: 'Lista de cursos disponíveis' })
  async listCourses() {
    return this.lmsService.listCourses();
  }

  @Public()
  @Get('course/:slug')
  @ApiOperation({ summary: 'Consultar detalhes de um curso, lista de aulas e progresso do aluno' })
  @ApiParam({ name: 'slug', description: 'Slug identificador do curso', example: 'html-e-css-para-iniciantes' })
  @ApiResponse({ status: 200, description: 'Dados completos do curso, aulas e certificado emitido' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  async getCourse(
    @Param('slug') slug: string,
    @CurrentUser('user_id') userId?: number,
  ) {
    return this.lmsService.getCourseBySlug(slug, userId);
  }

  @Roles('admin')
  @Post('lesson')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Criar ou atualizar aula em um curso (Exclusivo Admin)' })
  @ApiResponse({ status: 201, description: 'Aula salva com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer papel de admin)' })
  async createLesson(@Body() dto: LessonUpsertDto) {
    return this.lmsService.upsertLesson(dto);
  }

  @Roles('admin')
  @Get('lessons')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Listar todas as aulas cadastradas no sistema (Exclusivo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista consolidada de todas as aulas' })
  @ApiResponse({ status: 403, description: 'Acesso negado (requer papel de admin)' })
  async listLessons() {
    return this.lmsService.listAllLessons();
  }

  @Public()
  @Get('lesson/:courseSlug/:lessonSlug')
  @ApiOperation({ summary: 'Obter conteúdo e vídeo de uma aula com navegação anterior/próxima' })
  @ApiParam({ name: 'courseSlug', description: 'Slug do curso', example: 'html-e-css-para-iniciantes' })
  @ApiParam({ name: 'lessonSlug', description: 'Slug da aula', example: 'tags-basicas' })
  @ApiResponse({ status: 200, description: 'Conteúdo da aula e metadados de navegação' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
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
  @ApiOperation({ summary: 'Registrar conclusão de aula e emitir certificado automaticamente' })
  @ApiResponse({ status: 201, description: 'Aula concluída. Retorna ID do certificado se o curso foi 100% finalizado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async completeLesson(
    @Body() dto: CompleteLessonDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.completeLesson(dto.courseId, dto.lessonId, userId);
  }

  @Roles('user')
  @Delete('course/reset')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Resetar todo o progresso do aluno em um curso específico' })
  @ApiResponse({ status: 200, description: 'Progresso e certificados resetados' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async resetCourse(
    @Body() dto: ResetCourseDto,
    @CurrentUser('user_id') userId: number,
  ) {
    return this.lmsService.resetCourseProgress(dto.courseId, userId);
  }

  @Roles('user')
  @Get('certificates')
  @ApiCookieAuth('__Secure-sid')
  @ApiOperation({ summary: 'Listar todos os certificados emitidos para o aluno autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de certificados do aluno' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async listCertificates(@CurrentUser('user_id') userId: number) {
    return this.lmsService.listUserCertificates(userId);
  }

  @Public()
  @Get('certificate/:id')
  @ApiOperation({ summary: 'Download do PDF do certificado oficial de conclusão' })
  @ApiParam({ name: 'id', description: 'UUID do certificado', example: '35c20e46-3fc0-466c-85fc-947073c06c0a' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Buffer do PDF em alta resolução' })
  @ApiResponse({ status: 404, description: 'Certificado não encontrado' })
  async getCertificatePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.lmsService.getCertificatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer);
  }
}

