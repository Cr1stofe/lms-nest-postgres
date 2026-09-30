import { ApiProperty } from '@nestjs/swagger';

export class CourseUpsertResponseDto {
  @ApiProperty({
    description: 'Numeric ID of the created or updated course',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Number of affected rows/entities',
    example: 1,
  })
  changes: number;

  @ApiProperty({
    description: 'Operation outcome message',
    example: 'curso criado',
  })
  title: string;
}

export class CourseCatalogItemDto {
  @ApiProperty({
    description: 'Unique numeric course ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Unique URL-friendly course slug',
    example: 'html-e-css-para-iniciantes',
  })
  slug: string;

  @ApiProperty({
    description: 'Course title',
    example: 'HTML e CSS para Iniciantes',
  })
  title: string;

  @ApiProperty({
    description: 'Comprehensive course overview',
    example: 'Aprenda os fundamentos da web: marcação semântica, estilização moderna e acessibilidade.',
  })
  description: string;

  @ApiProperty({
    description: 'Estimated workload in hours',
    example: 8,
  })
  hours: number;

  @ApiProperty({
    description: 'Total number of published lessons in this course',
    example: 10,
  })
  lessons: number;

  @ApiProperty({
    description: 'Course creation timestamp',
    example: '2026-09-29 14:00:00',
  })
  created: string;
}

export class LessonSummaryDto {
  @ApiProperty({
    description: 'Unique numeric lesson ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Parent course ID',
    example: 1,
  })
  course_id: number;

  @ApiProperty({
    description: 'Unique lesson slug',
    example: 'tags-basicas',
  })
  slug: string;

  @ApiProperty({
    description: 'Lesson title',
    example: 'Tags Básicas e Estrutura Semântica',
  })
  title: string;

  @ApiProperty({
    description: 'Video duration in seconds',
    example: 600,
  })
  seconds: number;

  @ApiProperty({
    description: 'Video file URL or null if restricted to enrolled students',
    example: '/html/tags-basicas.mp4',
    nullable: true,
  })
  video: string | null;

  @ApiProperty({
    description: 'Lesson overview and syllabus content',
    example: 'Aprenda sobre html, head, body, h1-h6, p, a e img.',
  })
  description: string;

  @ApiProperty({
    description: 'Lesson sequence order index',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'Public preview flag (1: previewable, 0: members only)',
    example: 1,
  })
  free: number;

  @ApiProperty({
    description: 'Lesson creation timestamp',
    example: '2026-09-29 14:00:00',
  })
  created: string;
}

export class LessonCompletedStatusDto {
  @ApiProperty({
    description: 'Numeric ID of completed lesson',
    example: 1,
  })
  lesson_id: number;

  @ApiProperty({
    description: 'Completion timestamp',
    example: '2026-09-29 15:30:00',
  })
  completed: string;
}

export class CourseDetailResponseDto {
  @ApiProperty({
    description: 'Course metadata and properties',
    type: CourseCatalogItemDto,
  })
  course: CourseCatalogItemDto;

  @ApiProperty({
    description: 'Curriculum list of all lessons in sequence',
    type: [LessonSummaryDto],
  })
  lessons: LessonSummaryDto[];

  @ApiProperty({
    description: 'List of lessons completed by the authenticated student',
    type: [LessonCompletedStatusDto],
  })
  completed: LessonCompletedStatusDto[];

  @ApiProperty({
    description: 'UUID of the issued certificate if the course was fully completed, otherwise null',
    example: '35c20e46-3fc0-466c-85fc-947073c06c0a',
    nullable: true,
  })
  certificate: string | null;
}

export class LessonUpsertResponseDto {
  @ApiProperty({
    description: 'Numeric ID of the created or updated lesson',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Number of affected rows/entities',
    example: 1,
  })
  changes: number;

  @ApiProperty({
    description: 'Operation outcome message',
    example: 'aula criada',
  })
  title: string;
}

export class AdminLessonItemDto extends LessonSummaryDto {
  @ApiProperty({
    description: 'Parent course slug identifier',
    example: 'html-e-css-para-iniciantes',
  })
  course_slug: string;
}

export class LessonNavigationResponseDto extends LessonSummaryDto {
  @ApiProperty({
    description: 'Title of the parent course for breadcrumbs and context',
    example: 'HTML e CSS para Iniciantes',
  })
  course_title: string;

  @ApiProperty({
    description: 'Slug identifier of the parent course',
    example: 'html-e-css-para-iniciantes',
  })
  course_slug: string;

  @ApiProperty({
    description: 'Slug identifier of the previous lesson in curriculum, or null if first',
    example: null,
    nullable: true,
  })
  prev: string | null;

  @ApiProperty({
    description: 'Slug identifier of the next lesson in curriculum, or null if last',
    example: 'estruturacao-css',
    nullable: true,
  })
  next: string | null;

  @ApiProperty({
    description: 'Timestamp when student completed this lesson, or empty string if not completed',
    example: '2026-09-29 15:30:00',
  })
  completed: string;
}

export class CompleteLessonResponseDto {
  @ApiProperty({
    description: 'Certificate UUID if the course reached 100% completion, otherwise null',
    example: '35c20e46-3fc0-466c-85fc-947073c06c0a',
    nullable: true,
  })
  certificate: string | null;

  @ApiProperty({
    description: 'Operation outcome message',
    example: 'aula concluída',
  })
  title: string;
}

export class UserCertificateItemDto {
  @ApiProperty({
    description: 'Unique certificate UUID',
    example: '35c20e46-3fc0-466c-85fc-947073c06c0a',
  })
  id: string;

  @ApiProperty({
    description: 'User ID of certificate recipient',
    example: 1,
  })
  user_id: number;

  @ApiProperty({
    description: 'Recipient student full name',
    example: 'Henrique Barros',
  })
  name: string;

  @ApiProperty({
    description: 'Course numeric ID',
    example: 1,
  })
  course_id: number;

  @ApiProperty({
    description: 'Completed course title',
    example: 'HTML e CSS para Iniciantes',
  })
  title: string;

  @ApiProperty({
    description: 'Course workload in hours',
    example: 8,
  })
  hours: number;

  @ApiProperty({
    description: 'Total number of completed course lessons',
    example: 10,
  })
  lessons: number;

  @ApiProperty({
    description: 'Certificate issue timestamp',
    example: '2026-09-29 16:00:00',
  })
  completed: string;
}
